const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

const STATUSES = ['DRAFT', 'SENT', 'FINAL'];
const WORK_TYPES = [
  'START', 'DEMOLITION', 'PLUMBING', 'GAS', 'ELECTRIC', 'FIRE',
  'CARPENTRY', 'TILE', 'BATHROOM', 'PAINTING', 'FILM', 'WALLPAPER',
  'FURNITURE', 'FLOORING', 'FINISHING',
];

// 12개 비율 키 (Quote/Company 공유)
const RATE_KEYS = [
  'rateIndirectMaterial', 'rateIndirectLabor', 'rateIndustrialAcc',
  'rateEmployment', 'rateRetirement', 'rateSafety', 'rateOtherExpense',
  'rateMisc', 'rateGeneralAdmin', 'rateSupervision', 'rateDesign', 'rateVat',
];
// 11개 적용여부 키 (rateVat 제외 — 부가세는 항상 별도 표시)
const APPLY_KEYS = [
  'applyIndirectMaterial', 'applyIndirectLabor', 'applyIndustrialAcc',
  'applyEmployment', 'applyRetirement', 'applySafety', 'applyOtherExpense',
  'applyMisc', 'applyGeneralAdmin', 'applySupervision', 'applyDesign',
];

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

function num(v, d = 0) {
  if (v == null || v === '') return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

// ============================================
// 핵심: 원가내역서 18행 자동 계산
// ============================================
function computeTotals(lines, q) {
  // 라인 합계 → (1) (4) (7)
  let totalDirectMaterial = 0;
  let totalDirectLabor = 0;
  let totalDirectExpense = 0;
  for (const it of lines) {
    totalDirectMaterial += Number(it.materialCost);
    totalDirectLabor    += Number(it.laborCost);
    totalDirectExpense  += Number(it.expenseCost);
  }

  const r = (key) => Number(q[key]) / 100;
  const on = (key) => Boolean(q[key]);

  // 재료비
  const totalIndirectMaterial = on('applyIndirectMaterial') ? totalDirectMaterial * r('rateIndirectMaterial') : 0;
  const totalMaterial = totalDirectMaterial + totalIndirectMaterial;

  // 노무비
  const totalIndirectLabor = on('applyIndirectLabor') ? totalDirectLabor * r('rateIndirectLabor') : 0;
  const totalLabor = totalDirectLabor + totalIndirectLabor;

  // 경비
  const totalIndustrialAcc = on('applyIndustrialAcc') ? totalLabor * r('rateIndustrialAcc') : 0;
  const totalEmployment    = on('applyEmployment')    ? totalDirectLabor * r('rateEmployment')    : 0;
  const totalRetirement    = on('applyRetirement')    ? totalDirectLabor * r('rateRetirement')    : 0;
  const totalSafety        = on('applySafety')        ? (totalDirectMaterial + totalDirectLabor) * r('rateSafety') : 0;
  const totalOtherExpense  = on('applyOtherExpense')  ? (totalDirectMaterial + totalDirectLabor) * r('rateOtherExpense') : 0;
  const totalExpense = totalDirectExpense + totalIndustrialAcc + totalEmployment + totalRetirement + totalSafety + totalOtherExpense;

  // (14) 직접공사비계
  const totalDirect = totalMaterial + totalLabor + totalExpense;

  // 추가 비용
  const totalMisc         = on('applyMisc')         ? totalDirect * r('rateMisc')         : 0;
  const totalGeneralAdmin = on('applyGeneralAdmin') ? totalDirect * r('rateGeneralAdmin') : 0;
  const totalSupervision  = on('applySupervision')  ? (totalDirect + totalMisc + totalGeneralAdmin) * r('rateSupervision') : 0;
  const totalDesign       = on('applyDesign')       ? totalDirect * r('rateDesign')       : 0;

  // 공급가액 / 부가세 / 합계 (절삭)
  const totalSupply = totalDirect + totalMisc + totalGeneralAdmin + totalSupervision + totalDesign;
  const totalVat = totalSupply * r('rateVat');                    // 별도 표시
  const totalFinal = Math.floor(totalSupply / 100000) * 100000;   // 10만원 단위 절삭
  const totalRoundOff = totalSupply - totalFinal;

  return {
    totalDirectMaterial, totalIndirectMaterial, totalMaterial,
    totalDirectLabor, totalIndirectLabor, totalLabor,
    totalDirectExpense, totalIndustrialAcc, totalEmployment,
    totalRetirement, totalSafety, totalOtherExpense, totalExpense,
    totalDirect,
    totalMisc, totalGeneralAdmin, totalSupervision, totalDesign,
    totalSupply, totalVat, totalFinal, totalRoundOff,
  };
}

async function recomputeQuote(tx, quoteId) {
  const q = await tx.quote.findUnique({
    where: { id: quoteId },
    include: { lines: true },
  });
  if (!q) return null;
  const totals = computeTotals(q.lines, q);
  return tx.quote.update({ where: { id: quoteId }, data: totals });
}

// ============================================
// 견적 목록 / 상세
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const quotes = await prisma.quote.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { lines: true } },
      },
    });
    res.json({ quotes });
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const quote = await prisma.quote.findFirst({
      where: { id, projectId },
      include: {
        lines: { orderBy: [{ workType: 'asc' }, { orderIndex: 'asc' }] },
        createdBy: { select: { id: true, name: true } },
      },
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json({ quote });
  } catch (e) { next(e); }
});

// ============================================
// 견적 생성 (회사 비율 + 프로젝트 갑지 정보 스냅샷)
// ============================================
const createSchema = z.object({
  title: z.string().min(1).optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = createSchema.parse(req.body || {});
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const company = await prisma.company.findUnique({ where: { id: req.user.companyId } });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const existingCount = await prisma.quote.count({ where: { projectId } });
    const defaultTitle = `${existingCount + 1}차 견적`;

    // 회사 비율을 견적에 스냅샷
    const rateSnapshot = {};
    for (const k of RATE_KEYS) rateSnapshot[k] = company[k];

    const quote = await prisma.quote.create({
      data: {
        projectId,
        title: data.title?.trim() || defaultTitle,
        status: 'DRAFT',
        // 갑지 스냅샷 (Project에서 복사)
        customerName: project.customerName,
        customerPhone: project.customerPhone,
        siteAddress: project.siteAddress,
        projectName: project.name,
        area: project.area,
        // 비율 스냅샷
        ...rateSnapshot,
        terms: '* 부가가치세 별도\n* 견적외 공사 별도',
        createdById: req.user.id,
      },
    });

    const full = await prisma.quote.findUnique({
      where: { id: quote.id },
      include: { lines: true },
    });
    res.status(201).json({ quote: full });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// 견적 수정 (갑지/비율/적용여부)
// ============================================
const rateField = z.number().min(0).max(100);
const updateSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(STATUSES).optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().optional().nullable(),
  siteAddress: z.string().min(1).optional(),
  projectName: z.string().min(1).optional(),
  amountInWords: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  constructionStartDate: z.string().optional().nullable(),
  constructionEndDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  area: z.number().optional().nullable(),
  ...Object.fromEntries(RATE_KEYS.map((k) => [k, rateField.optional()])),
  ...Object.fromEntries(APPLY_KEYS.map((k) => [k, z.boolean().optional()])),
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const data = updateSchema.parse(req.body || {});
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.quote.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Quote not found' });

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.status !== undefined) updateData.status = data.status;
    if (data.customerName !== undefined) updateData.customerName = data.customerName.trim();
    if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone || null;
    if (data.siteAddress !== undefined) updateData.siteAddress = data.siteAddress.trim();
    if (data.projectName !== undefined) updateData.projectName = data.projectName.trim();
    if (data.amountInWords !== undefined) updateData.amountInWords = data.amountInWords?.trim() || null;
    if (data.validUntil !== undefined) updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    if (data.constructionStartDate !== undefined) updateData.constructionStartDate = data.constructionStartDate ? new Date(data.constructionStartDate) : null;
    if (data.constructionEndDate !== undefined) updateData.constructionEndDate = data.constructionEndDate ? new Date(data.constructionEndDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
    if (data.terms !== undefined) updateData.terms = data.terms?.trim() || null;
    if (data.area !== undefined) updateData.area = data.area;
    for (const k of RATE_KEYS) if (data[k] !== undefined) updateData[k] = data[k];
    for (const k of APPLY_KEYS) if (data[k] !== undefined) updateData[k] = data[k];

    const updated = await prisma.$transaction(async (tx) => {
      await tx.quote.update({ where: { id }, data: updateData });
      return recomputeQuote(tx, id);
    });

    const full = await prisma.quote.findUnique({
      where: { id: updated.id },
      include: { lines: { orderBy: [{ workType: 'asc' }, { orderIndex: 'asc' }] } },
    });
    res.json({ quote: full });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.quote.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Quote not found' });

    await prisma.quote.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// 견적 복제 (수정본 만들기)
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const src = await prisma.quote.findFirst({
      where: { id, projectId },
      include: { lines: true },
    });
    if (!src) return res.status(404).json({ error: 'Quote not found' });

    const existingCount = await prisma.quote.count({ where: { projectId } });
    const newTitle = `${existingCount + 1}차 견적 (수정)`;

    // src의 모든 필드를 복사하되 id/createdAt/updatedAt 제외
    const { id: _id, createdAt, updatedAt, lines: _lines, ...srcCopy } = src;

    const created = await prisma.$transaction(async (tx) => {
      const q = await tx.quote.create({
        data: {
          ...srcCopy,
          title: newTitle,
          status: 'DRAFT',
          createdById: req.user.id,
        },
      });
      if (src.lines.length > 0) {
        await tx.quoteLineItem.createMany({
          data: src.lines.map((l) => ({
            quoteId: q.id,
            workType: l.workType,
            itemName: l.itemName,
            spec: l.spec,
            unit: l.unit,
            quantity: l.quantity,
            materialUnitPrice: l.materialUnitPrice,
            laborUnitPrice: l.laborUnitPrice,
            expenseUnitPrice: l.expenseUnitPrice,
            materialCost: l.materialCost,
            laborCost: l.laborCost,
            expenseCost: l.expenseCost,
            notes: l.notes,
            orderIndex: l.orderIndex,
          })),
        });
      }
      return q;
    });

    const full = await prisma.quote.findUnique({
      where: { id: created.id },
      include: { lines: { orderBy: [{ workType: 'asc' }, { orderIndex: 'asc' }] } },
    });
    res.status(201).json({ quote: full });
  } catch (e) { next(e); }
});

// ============================================
// 라인 (세부 항목) CRUD
// ============================================
const lineCreateSchema = z.object({
  workType: z.enum(WORK_TYPES),
  itemName: z.string().min(1),
  spec: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  quantity: z.number().optional(),
  materialUnitPrice: z.number().optional(),
  laborUnitPrice: z.number().optional(),
  expenseUnitPrice: z.number().optional(),
  notes: z.string().optional().nullable(),
  orderIndex: z.number().int().optional(),
});

function lineDataFromInput(data) {
  const quantity = num(data.quantity, 1);
  const mu = num(data.materialUnitPrice);
  const lu = num(data.laborUnitPrice);
  const eu = num(data.expenseUnitPrice);
  return {
    workType: data.workType,
    itemName: data.itemName.trim(),
    spec: data.spec?.trim() || null,
    unit: data.unit?.trim() || null,
    quantity,
    materialUnitPrice: mu,
    laborUnitPrice: lu,
    expenseUnitPrice: eu,
    materialCost: Math.round(quantity * mu),
    laborCost: Math.round(quantity * lu),
    expenseCost: Math.round(quantity * eu),
    notes: data.notes?.trim() || null,
    orderIndex: data.orderIndex ?? 0,
  };
}

router.post('/:id/lines', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const data = lineCreateSchema.parse(req.body || {});
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const quote = await prisma.quote.findFirst({ where: { id, projectId } });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    await prisma.$transaction(async (tx) => {
      // 같은 공종의 마지막 orderIndex + 1
      if (data.orderIndex == null) {
        const last = await tx.quoteLineItem.findFirst({
          where: { quoteId: id, workType: data.workType },
          orderBy: { orderIndex: 'desc' },
        });
        data.orderIndex = (last?.orderIndex ?? -1) + 1;
      }
      await tx.quoteLineItem.create({
        data: { quoteId: id, ...lineDataFromInput(data) },
      });
      await recomputeQuote(tx, id);
    });

    const full = await prisma.quote.findUnique({
      where: { id },
      include: { lines: { orderBy: [{ workType: 'asc' }, { orderIndex: 'asc' }] } },
    });
    res.status(201).json({ quote: full });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// 템플릿 → 라인 일괄 생성 (마감재 bulk와 같은 패턴)
router.post('/:id/lines/bulk', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const quote = await prisma.quote.findFirst({ where: { id, projectId } });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) return res.status(400).json({ error: 'items 배열 필요' });

    await prisma.$transaction(async (tx) => {
      // 공종별 시작 orderIndex 산정
      const startMap = new Map();
      for (const it of items) {
        if (!WORK_TYPES.includes(it.workType)) continue;
        if (!startMap.has(it.workType)) {
          const last = await tx.quoteLineItem.findFirst({
            where: { quoteId: id, workType: it.workType },
            orderBy: { orderIndex: 'desc' },
          });
          startMap.set(it.workType, (last?.orderIndex ?? -1) + 1);
        }
      }
      const idxByType = new Map(startMap);

      const rows = [];
      for (const it of items) {
        if (!WORK_TYPES.includes(it.workType)) continue;
        const i = idxByType.get(it.workType);
        idxByType.set(it.workType, i + 1);
        rows.push({
          quoteId: id,
          ...lineDataFromInput({
            workType: it.workType,
            itemName: it.itemName || '(이름없음)',
            spec: it.spec,
            unit: it.unit,
            quantity: it.quantity,
            materialUnitPrice: it.materialUnitPrice,
            laborUnitPrice: it.laborUnitPrice,
            expenseUnitPrice: it.expenseUnitPrice,
            notes: it.notes,
            orderIndex: i,
          }),
        });
      }
      await tx.quoteLineItem.createMany({ data: rows });
      await recomputeQuote(tx, id);
    });

    const full = await prisma.quote.findUnique({
      where: { id },
      include: { lines: { orderBy: [{ workType: 'asc' }, { orderIndex: 'asc' }] } },
    });
    res.status(201).json({ quote: full });
  } catch (e) { next(e); }
});

const lineUpdateSchema = z.object({
  itemName: z.string().min(1).optional(),
  spec: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  quantity: z.number().optional(),
  materialUnitPrice: z.number().optional(),
  laborUnitPrice: z.number().optional(),
  expenseUnitPrice: z.number().optional(),
  notes: z.string().optional().nullable(),
  orderIndex: z.number().int().optional(),
});

router.patch('/:id/lines/:lineId', async (req, res, next) => {
  try {
    const { projectId, id, lineId } = req.params;
    const data = lineUpdateSchema.parse(req.body || {});
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const quote = await prisma.quote.findFirst({ where: { id, projectId } });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const line = await prisma.quoteLineItem.findFirst({ where: { id: lineId, quoteId: id } });
    if (!line) return res.status(404).json({ error: 'Line not found' });

    // 부분 업데이트: 변경 안된 필드는 기존값 사용해서 cost 재계산
    const merged = {
      itemName: data.itemName ?? line.itemName,
      spec: data.spec !== undefined ? data.spec : line.spec,
      unit: data.unit !== undefined ? data.unit : line.unit,
      quantity: data.quantity != null ? Number(data.quantity) : Number(line.quantity),
      materialUnitPrice: data.materialUnitPrice != null ? Number(data.materialUnitPrice) : Number(line.materialUnitPrice),
      laborUnitPrice:    data.laborUnitPrice    != null ? Number(data.laborUnitPrice)    : Number(line.laborUnitPrice),
      expenseUnitPrice:  data.expenseUnitPrice  != null ? Number(data.expenseUnitPrice)  : Number(line.expenseUnitPrice),
      notes: data.notes !== undefined ? data.notes : line.notes,
      orderIndex: data.orderIndex ?? line.orderIndex,
    };

    const updateData = {
      itemName: merged.itemName,
      spec: merged.spec?.toString().trim() || null,
      unit: merged.unit?.toString().trim() || null,
      quantity: merged.quantity,
      materialUnitPrice: merged.materialUnitPrice,
      laborUnitPrice: merged.laborUnitPrice,
      expenseUnitPrice: merged.expenseUnitPrice,
      materialCost: Math.round(merged.quantity * merged.materialUnitPrice),
      laborCost:    Math.round(merged.quantity * merged.laborUnitPrice),
      expenseCost:  Math.round(merged.quantity * merged.expenseUnitPrice),
      notes: merged.notes?.toString().trim() || null,
      orderIndex: merged.orderIndex,
    };

    await prisma.$transaction(async (tx) => {
      await tx.quoteLineItem.update({ where: { id: lineId }, data: updateData });
      await recomputeQuote(tx, id);
    });

    const full = await prisma.quote.findUnique({
      where: { id },
      include: { lines: { orderBy: [{ workType: 'asc' }, { orderIndex: 'asc' }] } },
    });
    res.json({ quote: full });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

router.delete('/:id/lines/:lineId', async (req, res, next) => {
  try {
    const { projectId, id, lineId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const quote = await prisma.quote.findFirst({ where: { id, projectId } });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const line = await prisma.quoteLineItem.findFirst({ where: { id: lineId, quoteId: id } });
    if (!line) return res.status(404).json({ error: 'Line not found' });

    await prisma.$transaction(async (tx) => {
      await tx.quoteLineItem.delete({ where: { id: lineId } });
      await recomputeQuote(tx, id);
    });

    const full = await prisma.quote.findUnique({
      where: { id },
      include: { lines: { orderBy: [{ workType: 'asc' }, { orderIndex: 'asc' }] } },
    });
    res.json({ quote: full });
  } catch (e) { next(e); }
});

module.exports = router;
