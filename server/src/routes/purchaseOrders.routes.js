const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

const STATUSES = ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'];

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// GET /api/projects/:projectId/purchase-orders
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = { projectId };
    if (req.query.status && STATUSES.includes(req.query.status)) where.status = req.query.status;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        material: {
          select: { id: true, spaceGroup: true, itemName: true, kind: true },
        },
        vendorEntity: { select: { id: true, name: true, category: true } },
      },
    });
    res.json({ orders });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  itemName: z.string().min(1),
  spec: z.string().optional().nullable(),
  vendor: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  quantity: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  unitPrice: z.number().optional().nullable(),
  totalPrice: z.number().optional().nullable(),
  status: z.enum(STATUSES).optional(),
  notes: z.string().optional().nullable(),
  expectedDate: z.string().optional().nullable(),
});

async function resolveVendor(companyId, vendorId, vendorText) {
  if (!vendorId) return { vendorId: null, vendor: vendorText?.trim() || null };
  const v = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId },
    select: { id: true, name: true },
  });
  if (!v) return { vendorId: null, vendor: vendorText?.trim() || null };
  return { vendorId: v.id, vendor: vendorText?.trim() || v.name };
}

// POST /api/projects/:projectId/purchase-orders  — 즉흥 발주 (마감재 미연동)
router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = createSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const vr = await resolveVendor(req.user.companyId, data.vendorId, data.vendor);

    const order = await prisma.purchaseOrder.create({
      data: {
        projectId,
        materialId: null,
        itemName: data.itemName.trim(),
        spec: data.spec?.trim() || null,
        vendor: vr.vendor,
        vendorId: vr.vendorId,
        quantity: num(data.quantity),
        unit: data.unit?.trim() || null,
        unitPrice: num(data.unitPrice),
        totalPrice: num(data.totalPrice),
        status: data.status || 'PENDING',
        notes: data.notes?.trim() || null,
        expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      },
    });
    res.status(201).json({ order });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const updateSchema = createSchema.partial();

// PATCH /api/projects/:projectId/purchase-orders/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const data = updateSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.purchaseOrder.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const updateData = {};
    if (data.itemName !== undefined) updateData.itemName = data.itemName.trim();
    if (data.spec !== undefined) updateData.spec = data.spec?.trim() || null;
    if (data.vendorId !== undefined || data.vendor !== undefined) {
      const r = await resolveVendor(
        req.user.companyId,
        data.vendorId !== undefined ? data.vendorId : existing.vendorId,
        data.vendor !== undefined ? data.vendor : existing.vendor,
      );
      updateData.vendorId = r.vendorId;
      updateData.vendor = r.vendor;
    }
    if (data.quantity !== undefined) updateData.quantity = num(data.quantity);
    if (data.unit !== undefined) updateData.unit = data.unit?.trim() || null;
    if (data.unitPrice !== undefined) updateData.unitPrice = num(data.unitPrice);
    if (data.totalPrice !== undefined) updateData.totalPrice = num(data.totalPrice);
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
    if (data.expectedDate !== undefined) updateData.expectedDate = data.expectedDate ? new Date(data.expectedDate) : null;

    // 상태 전이: 자동 타임스탬프 + 그 후 단계 reset
    if (data.status !== undefined && data.status !== existing.status) {
      updateData.status = data.status;
      if (data.status === 'ORDERED') {
        updateData.orderedAt = new Date();
        updateData.receivedAt = null;
      } else if (data.status === 'RECEIVED') {
        updateData.receivedAt = new Date();
        if (!existing.orderedAt) updateData.orderedAt = new Date();
      } else if (data.status === 'PENDING') {
        updateData.orderedAt = null;
        updateData.receivedAt = null;
      }
    }

    const updated = await prisma.purchaseOrder.update({ where: { id }, data: updateData });
    res.json({ order: updated });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// POST /api/projects/:projectId/purchase-orders/:id/acknowledge — ⚠️ 마감재 변경 표시 해제
router.post('/:id/acknowledge', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.purchaseOrder.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: { materialChangedAt: null },
    });
    res.json({ order });
  } catch (e) { next(e); }
});

// DELETE /api/projects/:projectId/purchase-orders/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.purchaseOrder.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    await prisma.purchaseOrder.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
