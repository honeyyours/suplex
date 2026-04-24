const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

const STATUSES = ['UNDECIDED', 'REVIEWING', 'CONFIRMED', 'CHANGED'];
const KINDS = ['FINISH', 'APPLIANCE'];

const TRACKED_FIELDS = [
  'kind', 'spaceGroup', 'subgroup', 'itemName', 'essential',
  'brand', 'productName', 'spec', 'siteNotes', 'purchaseSource', 'checked',
  'installed', 'size', 'remarks',
  'status', 'quantity', 'unit', 'unitPrice', 'totalPrice', 'memo',
];

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

function num(v) {
  return v == null || v === '' ? null : Number(v);
}

function fmtValue(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'object' && v.toString) return v.toString();
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return String(v);
}

// === 발주예정 (PurchaseOrder) 연동 헬퍼 ===
function buildPOFromMaterial(m) {
  const itemName = `${m.spaceGroup} · ${m.itemName}`;
  const specParts = [m.brand, m.productName, m.spec].filter(Boolean);
  return {
    itemName,
    spec: specParts.length > 0 ? specParts.join(' / ') : null,
    vendor: m.purchaseSource,
    quantity: m.quantity,
    unit: m.unit,
    unitPrice: m.unitPrice,
    totalPrice: m.totalPrice,
  };
}

// 마감재 status 또는 표시 필드 변경 시 호출.
// - oldStatus → CONFIRMED 전이: PO가 없으면 생성
// - 기존 연결된 PO들: PENDING이면 자동 동기화, 그 외(ORDERED/RECEIVED)는 materialChangedAt만 마킹
async function syncPurchaseOrders(tx, material, oldStatus) {
  const justConfirmed = oldStatus !== 'CONFIRMED' && material.status === 'CONFIRMED';

  // 1) CONFIRMED로 막 전이 + 기존 PO 없음 → 자동 생성
  if (justConfirmed) {
    const existingPO = await tx.purchaseOrder.findFirst({ where: { materialId: material.id } });
    if (!existingPO) {
      await tx.purchaseOrder.create({
        data: {
          projectId: material.projectId,
          materialId: material.id,
          ...buildPOFromMaterial(material),
          status: 'PENDING',
        },
      });
      return; // 새로 만들었으니 동기화 작업 불필요
    }
  }

  // 2) 기존 연결된 PO들 동기화 또는 변경 마킹
  const linked = await tx.purchaseOrder.findMany({ where: { materialId: material.id } });
  const synced = buildPOFromMaterial(material);
  for (const po of linked) {
    if (po.status === 'PENDING') {
      // 대기중 PO는 자동 동기화 + 변경 표시 해제
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { ...synced, materialChangedAt: null },
      });
    } else if (po.status === 'ORDERED' || po.status === 'RECEIVED') {
      // 발주완료/수령된 PO는 건드리지 않고 ⚠️ 표시만
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { materialChangedAt: new Date() },
      });
    }
    // CANCELLED는 무시
  }
}

// GET /api/projects/:projectId/materials?kind=FINISH
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = { projectId };
    if (req.query.kind && KINDS.includes(req.query.kind)) where.kind = req.query.kind;

    const materials = await prisma.material.findMany({
      where,
      orderBy: [{ kind: 'asc' }, { orderIndex: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ materials });
  } catch (e) {
    next(e);
  }
});

// GET /api/projects/:projectId/materials/:id/history
router.get('/:id/history', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const material = await prisma.material.findFirst({ where: { id, projectId } });
    if (!material) return res.status(404).json({ error: 'Material not found' });

    const history = await prisma.materialHistory.findMany({
      where: { materialId: id },
      include: { changedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ history });
  } catch (e) {
    next(e);
  }
});

const baseSchema = {
  kind: z.enum(KINDS).optional(),
  spaceGroup: z.string().min(1),
  subgroup: z.string().optional().nullable(),
  itemName: z.string().min(1),
  essential: z.boolean().optional(),
  brand: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  spec: z.string().optional().nullable(),
  siteNotes: z.string().optional().nullable(),
  purchaseSource: z.string().optional().nullable(),
  checked: z.boolean().optional(),
  installed: z.boolean().optional().nullable(),
  size: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  status: z.enum(STATUSES).optional(),
  quantity: z.number().optional().nullable(),
  unit: z.string().optional().nullable(),
  unitPrice: z.number().optional().nullable(),
  totalPrice: z.number().optional().nullable(),
  memo: z.string().optional().nullable(),
  orderIndex: z.number().int().optional(),
};

const createSchema = z.object(baseSchema);
const updateSchema = z.object({
  ...baseSchema,
  spaceGroup: baseSchema.spaceGroup.optional(),
  itemName: baseSchema.itemName.optional(),
});

function toCreateData(data) {
  return {
    kind: data.kind || 'FINISH',
    spaceGroup: data.spaceGroup.trim(),
    subgroup: data.subgroup?.trim() || null,
    itemName: data.itemName.trim(),
    essential: data.essential ?? false,
    brand: data.brand?.trim() || null,
    productName: data.productName?.trim() || null,
    spec: data.spec?.trim() || null,
    siteNotes: data.siteNotes?.trim() || null,
    purchaseSource: data.purchaseSource?.trim() || null,
    checked: data.checked ?? false,
    installed: data.installed ?? null,
    size: data.size?.trim() || null,
    remarks: data.remarks?.trim() || null,
    status: data.status || 'UNDECIDED',
    quantity: num(data.quantity),
    unit: data.unit?.trim() || null,
    unitPrice: num(data.unitPrice),
    totalPrice: num(data.totalPrice),
    memo: data.memo?.trim() || null,
    orderIndex: data.orderIndex ?? 0,
  };
}

// POST /api/projects/:projectId/materials
router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = createSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const material = await prisma.$transaction(async (tx) => {
      const m = await tx.material.create({
        data: { projectId, ...toCreateData(data) },
      });
      await tx.materialHistory.create({
        data: {
          materialId: m.id,
          changedById: req.user.id,
          field: '__created__',
          oldValue: null,
          newValue: `${m.spaceGroup} · ${m.itemName}`,
        },
      });
      // 처음 만들 때 status가 CONFIRMED면 PO 생성
      await syncPurchaseOrders(tx, m, null);
      return m;
    });

    res.status(201).json({ material });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// POST /api/projects/:projectId/materials/bulk  — 템플릿에서 일괄 생성
// body: { items: [{ kind, spaceGroup, itemName, siteNotes, orderIndex }, ...] }
router.post('/bulk', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) return res.status(400).json({ error: 'items 배열 필요' });

    const rows = items.map((it, i) => ({
      projectId,
      kind: KINDS.includes(it.kind) ? it.kind : 'FINISH',
      spaceGroup: String(it.spaceGroup || '').trim() || '기타',
      subgroup: it.subgroup ? String(it.subgroup).trim() || null : null,
      itemName: String(it.itemName || '').trim() || '(이름없음)',
      essential: !!it.essential,
      siteNotes: it.siteNotes ? String(it.siteNotes).trim() : null,
      orderIndex: typeof it.orderIndex === 'number' ? it.orderIndex : i,
    }));

    const result = await prisma.$transaction(async (tx) => {
      const created = await tx.material.createMany({ data: rows });

      // 이력 일괄 삽입
      const inserted = await tx.material.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: rows.length,
      });
      await tx.materialHistory.createMany({
        data: inserted.map((m) => ({
          materialId: m.id,
          changedById: req.user.id,
          field: '__created__',
          oldValue: null,
          newValue: `(템플릿) ${m.spaceGroup} · ${m.itemName}`,
        })),
      });

      return created.count;
    });

    res.status(201).json({ ok: true, created: result });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/projects/:projectId/materials/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const data = updateSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.material.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Material not found' });

    const historyEntries = [];
    const updateData = {};
    for (const f of TRACKED_FIELDS) {
      if (data[f] === undefined) continue;

      let newValue = data[f];
      if (['quantity', 'unitPrice', 'totalPrice'].includes(f)) {
        newValue = num(newValue);
      } else if (typeof newValue === 'string') {
        newValue = newValue.trim() || null;
      }

      const oldStr = fmtValue(existing[f]);
      const newStr = fmtValue(newValue);
      if (oldStr === newStr) continue;

      updateData[f] = newValue;
      historyEntries.push({
        materialId: id,
        changedById: req.user.id,
        field: f,
        oldValue: oldStr,
        newValue: newStr,
      });
    }

    if (historyEntries.length === 0) {
      return res.json({ material: existing });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.material.update({ where: { id }, data: updateData });
      await tx.materialHistory.createMany({ data: historyEntries });
      // 발주예정 연동: status 전이 또는 표시 필드 변경 → 동기화/마킹
      await syncPurchaseOrders(tx, u, existing.status);
      return u;
    });

    res.json({ material: updated });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// DELETE /api/projects/:projectId/materials   — 프로젝트 마감재 전체 삭제
// MaterialHistory는 Cascade, PurchaseOrder.materialId는 SetNull (연결된 PO는 유지)
router.delete('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const result = await prisma.material.deleteMany({ where: { projectId } });
    res.json({ ok: true, deleted: result.count });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/projects/:projectId/materials/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.material.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Material not found' });

    await prisma.material.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
