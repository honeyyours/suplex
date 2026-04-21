const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

const TYPES = ['MATERIAL_DEFECT', 'DIMENSION_ERROR', 'CUSTOMER_CHANGE', 'STRUCTURAL', 'WEATHER_DELAY', 'OTHER'];
const URGENCIES = ['NORMAL', 'WARNING', 'CRITICAL'];
const STATUSES = ['OPEN', 'RESOLVED'];

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

async function attachPhotos(issues, projectId) {
  const ids = issues.map((r) => r.id);
  if (ids.length === 0) return issues;
  const photos = await prisma.projectPhoto.findMany({
    where: { projectId, source: 'ISSUE', sourceId: { in: ids } },
    orderBy: { createdAt: 'asc' },
  });
  const byIssue = {};
  photos.forEach((p) => {
    (byIssue[p.sourceId] = byIssue[p.sourceId] || []).push(p);
  });
  return issues.map((r) => ({ ...r, photos: byIssue[r.id] || [] }));
}

// GET /api/projects/:projectId/issues?status=&urgency=
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = { projectId };
    if (req.query.status && STATUSES.includes(req.query.status)) where.status = req.query.status;
    if (req.query.urgency && URGENCIES.includes(req.query.urgency)) where.urgency = req.query.urgency;

    let issues = await prisma.issue.findMany({
      where,
      include: { author: { select: { id: true, name: true } } },
      orderBy: [
        { status: 'asc' }, // OPEN first
        { urgency: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 200,
    });
    issues = await attachPhotos(issues, projectId);
    res.json({ issues });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  title: z.string().min(1),
  type: z.enum(TYPES).optional(),
  urgency: z.enum(URGENCIES).optional(),
  memo: z.string().optional().nullable(),
  notifyOwner: z.boolean().optional(),
});

// POST /api/projects/:projectId/issues
router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = createSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const issue = await prisma.issue.create({
      data: {
        projectId,
        authorId: req.user.id,
        title: data.title.trim(),
        type: data.type || 'OTHER',
        urgency: data.urgency || 'NORMAL',
        memo: data.memo?.trim() || null,
        notifyOwner: data.notifyOwner ?? true,
      },
      include: { author: { select: { id: true, name: true } } },
    });
    res.status(201).json({ issue });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  type: z.enum(TYPES).optional(),
  urgency: z.enum(URGENCIES).optional(),
  status: z.enum(STATUSES).optional(),
  memo: z.string().optional().nullable(),
});

// PATCH /api/projects/:projectId/issues/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const data = updateSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.issue.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Issue not found' });

    if (req.user.role === 'FIELD' && existing.authorId !== req.user.id && data.status === undefined) {
      return res.status(403).json({ error: '본인 작성만 수정 가능' });
    }

    const updated = await prisma.issue.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.urgency !== undefined && { urgency: data.urgency }),
        ...(data.memo !== undefined && { memo: data.memo?.trim() || null }),
        ...(data.status !== undefined && {
          status: data.status,
          resolvedAt: data.status === 'RESOLVED' ? new Date() : null,
        }),
      },
      include: { author: { select: { id: true, name: true } } },
    });
    res.json({ issue: updated });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// DELETE /api/projects/:projectId/issues/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.issue.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Issue not found' });

    if (req.user.role === 'FIELD' && existing.authorId !== req.user.id) {
      return res.status(403).json({ error: '본인 작성만 삭제 가능' });
    }

    await prisma.$transaction([
      prisma.projectPhoto.deleteMany({ where: { projectId, source: 'ISSUE', sourceId: id } }),
      prisma.issue.delete({ where: { id } }),
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
