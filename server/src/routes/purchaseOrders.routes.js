const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { getDeadlineDays } = require('../services/phaseDeadlines');

const router = express.Router({ mergeParams: true });
const globalRouter = express.Router();
router.use(authRequired);
globalRouter.use(authRequired);

const STATUSES = ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'];

// GET /api/purchase-orders   — 회사 전체 PO + 필터
globalRouter.get('/', async (req, res, next) => {
  try {
    const where = { project: { companyId: req.user.companyId } };
    if (req.query.projectId) where.projectId = req.query.projectId;
    if (req.query.status && STATUSES.includes(req.query.status)) where.status = req.query.status;
    if (req.query.vendorId) where.vendorId = req.query.vendorId;
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(req.query.from);
      if (req.query.to) where.createdAt.lte = new Date(req.query.to);
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        // 발주 복사 메시지에 현장 정보 포함시키기 위해 프로젝트 상세 일부도 함께
        project: { select: { id: true, name: true, siteAddress: true, siteNotes: true, customerPhone: true } },
        material: {
          select: { id: true, spaceGroup: true, itemName: true, kind: true, formKey: true },
        },
        vendorEntity: { select: { id: true, name: true, category: true } },
      },
    });

    // 각 PO에 데드라인 자동 계산 — 같은 프로젝트 일정 entry 중 같은 카테고리(=spaceGroup)의 가장 빠른 시작일 - D-N
    const enriched = await annotateOrdersWithDeadline(orders);
    res.json({ orders: enriched });
  } catch (e) { next(e); }
});

// 데드라인 계산 — N+1 방지 위해 프로젝트별 일정 한 번에 fetch
async function annotateOrdersWithDeadline(orders) {
  const projectIds = [...new Set(orders.map((o) => o.projectId).filter(Boolean))];
  if (projectIds.length === 0) return orders.map((o) => ({ ...o, deadline: null, daysToDeadline: null }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 각 프로젝트의 카테고리별 가장 빠른 (오늘 이후) 시작일
  const entries = await prisma.dailyScheduleEntry.findMany({
    where: { projectId: { in: projectIds }, date: { gte: today } },
    orderBy: { date: 'asc' },
    select: { projectId: true, date: true, category: true },
  });
  // map[projectId][categoryKey] = earliestDate
  const earliestMap = new Map();
  for (const e of entries) {
    if (!e.category) continue;
    const cat = String(e.category).trim();
    if (!cat) continue;
    if (!earliestMap.has(e.projectId)) earliestMap.set(e.projectId, new Map());
    const inner = earliestMap.get(e.projectId);
    if (!inner.has(cat)) inner.set(cat, e.date);
  }

  // 부분 매칭(spaceGroup → category) 헬퍼
  function findEarliestForGroup(projectId, group) {
    const inner = earliestMap.get(projectId);
    if (!inner) return null;
    const g = String(group || '').trim();
    if (!g) return null;
    if (inner.has(g)) return inner.get(g);
    // 부분 포함 매칭
    for (const [cat, date] of inner) {
      if (cat.includes(g) || g.includes(cat)) return date;
    }
    return null;
  }

  return orders.map((o) => {
    const group = o.material?.spaceGroup;
    const earliest = findEarliestForGroup(o.projectId, group);
    if (!earliest) return { ...o, deadline: null, daysToDeadline: null };
    const dn = getDeadlineDays(group);
    const deadline = new Date(earliest);
    deadline.setDate(deadline.getDate() - dn);
    deadline.setHours(0, 0, 0, 0);
    const diffMs = deadline.getTime() - today.getTime();
    const daysToDeadline = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { ...o, deadline: deadline.toISOString(), daysToDeadline };
  });
}

// GET /api/purchase-orders/pending-models   — 모델 확인 필요 마감재 (PO 생성 전 단계)
globalRouter.get('/pending-models', async (req, res, next) => {
  try {
    const where = {
      project: { companyId: req.user.companyId },
      status: { in: ['UNDECIDED', 'REVIEWING'] },
    };
    if (req.query.projectId) where.projectId = req.query.projectId;
    const materials = await prisma.material.findMany({
      where,
      orderBy: [{ projectId: 'asc' }, { kind: 'asc' }, { orderIndex: 'asc' }],
      include: {
        project: { select: { id: true, name: true } },
      },
    });
    res.json({ materials });
  } catch (e) { next(e); }
});

// GET /api/purchase-orders/summary   — 통계 카드용
globalRouter.get('/summary', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const projectFilter = req.query.projectId ? { projectId: req.query.projectId } : {};
    const baseWhere = { project: { companyId }, ...projectFilter };

    const [pending, ordered, received, cancelled, pendingModels, pendingOrders] = await Promise.all([
      prisma.purchaseOrder.count({ where: { ...baseWhere, status: 'PENDING' } }),
      prisma.purchaseOrder.count({ where: { ...baseWhere, status: 'ORDERED' } }),
      prisma.purchaseOrder.count({ where: { ...baseWhere, status: 'RECEIVED' } }),
      prisma.purchaseOrder.count({ where: { ...baseWhere, status: 'CANCELLED' } }),
      prisma.material.count({
        where: {
          project: { companyId },
          ...(req.query.projectId ? { projectId: req.query.projectId } : {}),
          status: { in: ['UNDECIDED', 'REVIEWING'] },
        },
      }),
      // 데드라인 임박 계산용 — PENDING 발주 자세히
      prisma.purchaseOrder.findMany({
        where: { ...baseWhere, status: 'PENDING' },
        include: {
          material: { select: { spaceGroup: true } },
        },
      }),
    ]);

    // 데드라인 임박(D-7 이내) 카운트 — PENDING 중에서만
    const enriched = await annotateOrdersWithDeadline(pendingOrders);
    const urgent = enriched.filter((o) => o.daysToDeadline != null && o.daysToDeadline <= 7).length;

    res.json({ pending, ordered, received, cancelled, pendingModels, urgent });
  } catch (e) { next(e); }
});

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

    // PO가 활성 → CANCELLED로 전환된 경우, 연결된 마감재가 다른 활성 PO 없으면 status를 UNDECIDED로 되돌림
    // 이래야 마감재 탭에서 자동으로 잠금 해제 + 체크 풀림 → 디자이너가 다시 편집 가능
    if (updated.status === 'CANCELLED' && existing.status !== 'CANCELLED' && updated.materialId) {
      const otherActive = await prisma.purchaseOrder.count({
        where: {
          materialId: updated.materialId,
          id: { not: updated.id },
          status: { in: ['PENDING', 'ORDERED', 'RECEIVED'] },
        },
      });
      if (otherActive === 0) {
        await prisma.material.update({
          where: { id: updated.materialId },
          data: { status: 'UNDECIDED' },
        });
      }
    }

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

    // 삭제된 PO가 활성 상태였고 연결된 마감재가 다른 활성 PO 없으면 → 마감재 미정으로 되돌림
    if (existing.materialId && ['PENDING', 'ORDERED', 'RECEIVED'].includes(existing.status)) {
      const otherActive = await prisma.purchaseOrder.count({
        where: {
          materialId: existing.materialId,
          status: { in: ['PENDING', 'ORDERED', 'RECEIVED'] },
        },
      });
      if (otherActive === 0) {
        await prisma.material.update({
          where: { id: existing.materialId },
          data: { status: 'UNDECIDED' },
        });
      }
    }

    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = { projectRouter: router, globalRouter };
