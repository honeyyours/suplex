const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

const STATUSES = ['PENDING', 'ORDERED', 'DELIVERED', 'CANCELLED'];

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

async function attachPhotos(rows, projectId) {
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return rows;
  const photos = await prisma.projectPhoto.findMany({
    where: { projectId, source: 'MATERIAL_REQUEST', sourceId: { in: ids } },
    orderBy: { createdAt: 'asc' },
  });
  const byId = {};
  photos.forEach((p) => {
    (byId[p.sourceId] = byId[p.sourceId] || []).push(p);
  });
  return rows.map((r) => ({ ...r, photos: byId[r.id] || [] }));
}

// GET /api/projects/:projectId/material-requests?status=
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = { projectId };
    if (req.query.status && STATUSES.includes(req.query.status)) where.status = req.query.status;

    let items = await prisma.materialRequest.findMany({
      where,
      include: { requestedBy: { select: { id: true, name: true } } },
      orderBy: [{ status: 'asc' }, { neededDate: 'asc' }, { createdAt: 'desc' }],
      take: 200,
    });
    items = await attachPhotos(items, projectId);
    res.json({ requests: items });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  materialName: z.string().min(1),
  quantity: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  neededDate: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
  notifyOwner: z.boolean().optional(),
});

// POST /api/projects/:projectId/material-requests
router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = createSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const request = await prisma.materialRequest.create({
      data: {
        projectId,
        requestedById: req.user.id,
        materialName: data.materialName.trim(),
        quantity: data.quantity != null ? Number(data.quantity) : null,
        unit: data.unit?.trim() || null,
        neededDate: data.neededDate ? new Date(data.neededDate) : null,
        memo: data.memo?.trim() || null,
        notifyOwner: data.notifyOwner ?? true,
      },
      include: { requestedBy: { select: { id: true, name: true } } },
    });
    res.status(201).json({ request });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const updateSchema = z.object({
  materialName: z.string().min(1).optional(),
  quantity: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  neededDate: z.string().optional().nullable(),
  memo: z.string().optional().nullable(),
  status: z.enum(STATUSES).optional(),
});

// PATCH /api/projects/:projectId/material-requests/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const data = updateSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.materialRequest.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Request not found' });

    if (req.user.role === 'FIELD' && existing.requestedById !== req.user.id && data.status === undefined) {
      return res.status(403).json({ error: '본인 요청만 수정 가능' });
    }

    const statusTimestamps = {};
    if (data.status === 'ORDERED' && existing.status !== 'ORDERED') statusTimestamps.orderedAt = new Date();
    if (data.status === 'DELIVERED' && existing.status !== 'DELIVERED') statusTimestamps.deliveredAt = new Date();

    const updated = await prisma.materialRequest.update({
      where: { id },
      data: {
        ...(data.materialName !== undefined && { materialName: data.materialName.trim() }),
        ...(data.quantity !== undefined && { quantity: data.quantity != null ? Number(data.quantity) : null }),
        ...(data.unit !== undefined && { unit: data.unit?.trim() || null }),
        ...(data.neededDate !== undefined && { neededDate: data.neededDate ? new Date(data.neededDate) : null }),
        ...(data.memo !== undefined && { memo: data.memo?.trim() || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...statusTimestamps,
      },
      include: { requestedBy: { select: { id: true, name: true } } },
    });
    res.json({ request: updated });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// DELETE /api/projects/:projectId/material-requests/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.materialRequest.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Request not found' });

    if (req.user.role === 'FIELD' && existing.requestedById !== req.user.id) {
      return res.status(403).json({ error: '본인 요청만 삭제 가능' });
    }

    await prisma.$transaction([
      prisma.projectPhoto.deleteMany({ where: { projectId, source: 'MATERIAL_REQUEST', sourceId: id } }),
      prisma.materialRequest.delete({ where: { id } }),
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
