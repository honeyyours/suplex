const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { fetchEarliestByCategory, findEarliestForGroup, buildDeadline, fetchCompanyDeadlineRules } = require('../services/phaseDeadlines');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

const STATUSES = ['UNDECIDED', 'REVIEWING', 'CONFIRMED', 'CHANGED', 'REUSED', 'NOT_APPLICABLE'];
const KINDS = ['FINISH', 'APPLIANCE'];

const TRACKED_FIELDS = [
  'kind', 'spaceGroup', 'subgroup', 'itemName', 'essential', 'formKey',
  'brand', 'productName', 'modelCode', 'spec', 'customSpec', 'siteNotes', 'purchaseSource', 'checked',
  'installed', 'size', 'remarks', 'sourceUrl',
  'status', 'quantity', 'unit', 'unitPrice', 'totalPrice', 'memo',
  'inheritFromMaterialId',
];

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

function num(v) {
  return v == null || v === '' ? null : Number(v);
}

function fmtValue(v) {
  if (v == null || v === '') return null;
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'object') {
    // Decimal, Date 등은 toString이 의미있는 값. 일반 객체(JSON)는 stringify.
    if (typeof v.toString === 'function' && v.toString !== Object.prototype.toString) return v.toString();
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  return String(v);
}

// === 발주예정 (PurchaseOrder) 연동 헬퍼 ===
const PO_DONE_STATUSES = ['CONFIRMED', 'CHANGED']; // 발주 대상 status

function buildPOFromMaterial(m) {
  const itemName = `${m.spaceGroup} · ${m.itemName}`;
  const parts = [];
  if (m.brand) parts.push(m.brand);
  if (m.productName) parts.push(m.productName);
  if (m.customSpec && typeof m.customSpec === 'object') {
    for (const v of Object.values(m.customSpec)) {
      if (v) parts.push(String(v));
    }
  }
  if (m.spec) parts.push(m.spec);
  return {
    itemName,
    spec: parts.length > 0 ? parts.join(' / ') : null,
    vendor: m.purchaseSource,
    quantity: m.quantity,
    unit: m.unit,
    unitPrice: m.unitPrice,
    totalPrice: m.totalPrice,
  };
}

// 마감재 → 발주 자동 트리거.
// - status가 done 그룹(CONFIRMED/CHANGED)으로 막 전이 → PO PENDING 자동 생성
// - 기존 연결 PO들: PENDING이면 자동 동기화, 그 외(ORDERED/RECEIVED)는 materialChangedAt 마킹
// - status가 done에서 빠져도 기존 PO는 손 안 댐 (사용자 수동 처리)
async function syncPurchaseOrders(tx, material, oldStatus) {
  const wasDone = PO_DONE_STATUSES.includes(oldStatus);
  const isDone = PO_DONE_STATUSES.includes(material.status);
  const justConfirmed = !wasDone && isDone;

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
      include: {
        inheritFrom: {
          select: {
            id: true, spaceGroup: true, itemName: true,
            brand: true, productName: true, spec: true, customSpec: true,
            status: true,
          },
        },
        // 활성 PO(취소되지 않은 것)가 하나라도 있으면 잠금 — 마감재 행 편집 막기
        purchaseOrders: {
          where: { status: { in: ['PENDING', 'ORDERED', 'RECEIVED'] } },
          select: { id: true, status: true },
        },
      },
    });
    // 데드라인 계산 — 같은 프로젝트의 일정 entry + 회사 룰 1번만 fetch
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [earliestMap, companyRules] = await Promise.all([
      fetchEarliestByCategory(prisma, [projectId]),
      fetchCompanyDeadlineRules(prisma, req.user.companyId),
    ]);

    // 클라이언트가 쉽게 쓸 수 있게 hasActiveOrder/activeOrderStatus + deadline 부가
    const enriched = materials.map((m) => {
      const active = m.purchaseOrders?.[0];
      const earliest = findEarliestForGroup(earliestMap, projectId, m.spaceGroup);
      const dl = buildDeadline(earliest, m.spaceGroup, today, companyRules);
      return {
        ...m,
        hasActiveOrder: !!active,
        activeOrderStatus: active?.status || null,
        deadline: dl.deadline,
        daysToDeadline: dl.daysToDeadline,
      };
    });
    res.json({ materials: enriched });
  } catch (e) {
    next(e);
  }
});

// ============================================
// 그룹(spaceGroup) 일괄 이름 변경 / 통째 삭제
// /:id 라우트들보다 먼저 정의되어야 매칭됨
// ============================================
router.post('/groups/rename', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const from = String(req.body?.from || '').trim();
    const to = String(req.body?.to || '').trim();
    if (!from || !to) return res.status(400).json({ error: 'from / to 필수' });
    if (from === to) return res.json({ updated: 0 });

    const result = await prisma.material.updateMany({
      where: { projectId, spaceGroup: from },
      data: { spaceGroup: to },
    });
    res.json({ updated: result.count, from, to });
  } catch (e) { next(e); }
});

router.delete('/groups/:name', async (req, res, next) => {
  try {
    const { projectId, name } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const result = await prisma.material.deleteMany({
      where: { projectId, spaceGroup: decodeURIComponent(name) },
    });
    res.json({ deleted: result.count });
  } catch (e) { next(e); }
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
  itemName: z.string().default(''), // 빈 문자열 허용 — 인라인 편집 모드에서 placeholder 행 생성용
  essential: z.boolean().optional(),
  formKey: z.string().optional().nullable(),
  customSpec: z.any().optional().nullable(),
  inheritFromMaterialId: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  productName: z.string().optional().nullable(),
  modelCode: z.string().optional().nullable(),
  spec: z.string().optional().nullable(),
  siteNotes: z.string().optional().nullable(),
  purchaseSource: z.string().optional().nullable(),
  checked: z.boolean().optional(),
  installed: z.boolean().optional().nullable(),
  size: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
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
    itemName: (data.itemName || '').trim(),
    essential: data.essential ?? false,
    formKey: data.formKey?.trim() || null,
    customSpec: data.customSpec ?? null,
    inheritFromMaterialId: data.inheritFromMaterialId || null,
    brand: data.brand?.trim() || null,
    productName: data.productName?.trim() || null,
    modelCode: data.modelCode?.trim() || null,
    spec: data.spec?.trim() || null,
    siteNotes: data.siteNotes?.trim() || null,
    purchaseSource: data.purchaseSource?.trim() || null,
    checked: data.checked ?? false,
    installed: data.installed ?? null,
    size: data.size?.trim() || null,
    remarks: data.remarks?.trim() || null,
    sourceUrl: data.sourceUrl?.trim() || null,
    status: data.status || 'UNDECIDED',
    quantity: num(data.quantity),
    unit: data.unit?.trim() || null,
    unitPrice: num(data.unitPrice),
    totalPrice: num(data.totalPrice),
    memo: data.memo?.trim() || null,
    orderIndex: data.orderIndex ?? 0,
  };
}

// formKey 자동 채우기 — 회사 MaterialTemplate에서 (spaceGroup, itemName) 매칭
async function resolveFormKey(companyId, spaceGroup, itemName) {
  if (!spaceGroup || !itemName) return null;
  const t = await prisma.materialTemplate.findFirst({
    where: { companyId, spaceGroup, itemName, formKey: { not: null } },
    select: { formKey: true },
  });
  return t?.formKey || null;
}

// POST /api/projects/:projectId/materials
router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = createSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // formKey 미지정 시 templates에서 자동 매칭
    if (!data.formKey) {
      data.formKey = await resolveFormKey(req.user.companyId, data.spaceGroup, data.itemName);
    }

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
      // 처음 만들 때 status가 CONFIRMED/CHANGED면 PO 자동 생성
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

    // formKey 누락 항목은 회사 templates에서 (spaceGroup, itemName) 매칭으로 자동 채움
    const tpls = await prisma.materialTemplate.findMany({
      where: { companyId: req.user.companyId, formKey: { not: null } },
      select: { spaceGroup: true, itemName: true, formKey: true },
    });
    const tplMap = new Map();
    for (const t of tpls) tplMap.set(`${t.spaceGroup}::${t.itemName}`, t.formKey);

    const rows = items.map((it, i) => {
      const sg = String(it.spaceGroup || '').trim() || '기타';
      const item = String(it.itemName || '').trim() || '(이름없음)';
      const fk = it.formKey?.trim() || tplMap.get(`${sg}::${item}`) || null;
      return {
        projectId,
        kind: KINDS.includes(it.kind) ? it.kind : 'FINISH',
        spaceGroup: sg,
        subgroup: it.subgroup ? String(it.subgroup).trim() || null : null,
        itemName: item,
        essential: !!it.essential,
        formKey: fk,
        siteNotes: it.siteNotes ? String(it.siteNotes).trim() : null,
        orderIndex: typeof it.orderIndex === 'number' ? it.orderIndex : i,
      };
    });

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
        const trimmed = newValue.trim();
        // itemName / spaceGroup은 DB NOT NULL — 빈 문자열 허용, null 변환 X
        newValue = (f === 'itemName' || f === 'spaceGroup') ? trimmed : (trimmed || null);
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
      // status 전이 또는 표시 필드 변경 → PO 동기화
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

// ============================================
// 공정별 불러오기 — 회사 템플릿 + 다른 프로젝트 마감재
// 사용자가 그룹 헤더의 "📋 불러오기" 클릭 시 모달에 노출할 후보
// ============================================
router.get('/_import-suggestions', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const phase = String(req.query.phase || '').trim();
    if (!phase) return res.status(400).json({ error: 'phase required' });

    const companyId = req.user.companyId;
    // 회사 템플릿 — 정확 일치
    const templates = await prisma.materialTemplate.findMany({
      where: { companyId, spaceGroup: phase, active: true },
      orderBy: [{ orderIndex: 'asc' }, { itemName: 'asc' }],
      select: {
        id: true, kind: true, spaceGroup: true, subgroup: true, itemName: true,
        formKey: true, defaultSiteNotes: true,
      },
    });

    // 다른 프로젝트의 마감재 — 회사의 다른 프로젝트, 같은 spaceGroup
    // distinct itemName + brand + productName + modelCode + spec 조합
    const otherMaterials = await prisma.material.findMany({
      where: {
        project: { companyId },
        projectId: { not: projectId },
        spaceGroup: phase,
        // 빈 itemName 제외
        itemName: { not: '' },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
      select: {
        id: true, kind: true, spaceGroup: true, itemName: true,
        brand: true, productName: true, modelCode: true, spec: true,
        siteNotes: true, sourceUrl: true,
        project: { select: { id: true, name: true } },
      },
    });

    // distinct: 같은 itemName+brand+productName+spec은 가장 최근 1건만
    const seen = new Set();
    const distinctMaterials = [];
    for (const m of otherMaterials) {
      const key = [m.itemName, m.brand, m.productName, m.modelCode, m.spec].filter(Boolean).join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      distinctMaterials.push(m);
    }

    res.json({
      phase,
      templates,
      otherProjectMaterials: distinctMaterials,
    });
  } catch (e) { next(e); }
});

// POST /:projectId/materials/_import
// body: { spaceGroup, kind, items: [{ itemName, brand?, productName?, modelCode?, spec?, siteNotes?, formKey?, subgroup?, sourceUrl? }] }
// 일괄 createMany. 새 마감재 status는 UNDECIDED.
const importSchema = z.object({
  spaceGroup: z.string().min(1),
  kind: z.enum(['FINISH', 'APPLIANCE']).default('FINISH'),
  items: z.array(z.object({
    itemName: z.string().min(1),
    brand: z.string().optional().nullable(),
    productName: z.string().optional().nullable(),
    modelCode: z.string().optional().nullable(),
    spec: z.string().optional().nullable(),
    siteNotes: z.string().optional().nullable(),
    formKey: z.string().optional().nullable(),
    subgroup: z.string().optional().nullable(),
    sourceUrl: z.string().optional().nullable(),
  })).min(1).max(50),
});

router.post('/_import', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: req.user.companyId },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const data = importSchema.parse(req.body);

    // 다음 orderIndex
    const last = await prisma.material.findFirst({
      where: { projectId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    let nextOrder = last ? last.orderIndex + 1 : 0;

    const rows = data.items.map((it) => ({
      projectId,
      kind: data.kind,
      spaceGroup: data.spaceGroup,
      itemName: it.itemName,
      brand: it.brand || null,
      productName: it.productName || null,
      modelCode: it.modelCode || null,
      spec: it.spec || null,
      siteNotes: it.siteNotes || null,
      formKey: it.formKey || null,
      subgroup: it.subgroup || null,
      sourceUrl: it.sourceUrl || null,
      orderIndex: nextOrder++,
    }));

    const created = await prisma.material.createMany({ data: rows });
    const inserted = await prisma.material.findMany({
      where: { projectId, spaceGroup: data.spaceGroup },
      orderBy: { orderIndex: 'desc' },
      take: created.count,
    });

    res.status(201).json({ count: created.count, materials: inserted });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

module.exports = router;
