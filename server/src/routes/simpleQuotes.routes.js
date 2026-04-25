const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

const STATUSES = ['DRAFT', 'SENT', 'ACCEPTED', 'SUPERSEDED'];

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

function num(v, d = 0) {
  if (v == null || v === '') return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

// ============================================
// 합계 계산
//   라인 합계 → 디자인및감리비 → (단수조정 적용) → 부가세 → 총합계
// ============================================
function computeTotals(lines, q) {
  let subtotal = 0;
  for (const l of lines) {
    if (l.isGroup) continue; // 그룹 헤더는 합계 제외
    const amt = Number(l.amount ?? Number(l.quantity) * Number(l.unitPrice));
    subtotal += Number.isFinite(amt) ? amt : 0;
  }
  const designFeeRate = Number(q.designFeeRate) / 100;
  const vatRate = Number(q.vatRate) / 100;
  const round = Number(q.roundAdjustment) || 0;

  const designFeeAmount = Math.round(subtotal * designFeeRate);
  const subAfterDesign = subtotal + designFeeAmount + round;
  const vatAmount = Math.round(subAfterDesign * vatRate);
  const total = subAfterDesign + vatAmount;

  return { subtotal, designFeeAmount, vatAmount, total };
}

async function recomputeQuote(tx, quoteId) {
  const q = await tx.simpleQuote.findUnique({
    where: { id: quoteId },
    include: { lines: true },
  });
  if (!q) return null;
  const totals = computeTotals(q.lines, q);
  return tx.simpleQuote.update({ where: { id: quoteId }, data: totals });
}

// ============================================
// 회사 정보 스냅샷
// ============================================
async function snapshotCompany(companyId) {
  const c = await prisma.company.findUnique({ where: { id: companyId } });
  if (!c) return {};
  return {
    supplierName: c.name || '',
    supplierRegNo: c.bizNumber || null,
    supplierOwner: c.representative || null,
    supplierAddress: c.address || null,
    supplierTel: c.phone || null,
    supplierEmail: c.email || null,
    supplierLogoUrl: c.logoUrl || null,
    vatRate: Number(c.rateVat ?? 10),
  };
}

// ============================================
// 목록 / 상세
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const quotes = await prisma.simpleQuote.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { lines: true } } },
    });
    res.json({ quotes });
  } catch (e) { next(e); }
});

// 회사 내 다른 견적 검색 (불러오기 모달용) — :id 보다 먼저 매칭되어야 함
router.get('/_sources', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const q = (req.query.q || '').toString().trim();
    const where = {
      project: { companyId: req.user.companyId },
      ...(q
        ? {
            OR: [
              { project: { name: { contains: q, mode: 'insensitive' } } },
              { project: { customerName: { contains: q, mode: 'insensitive' } } },
              { title: { contains: q, mode: 'insensitive' } },
              { projectName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const quotes = await prisma.simpleQuote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        project: { select: { id: true, name: true, customerName: true } },
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

    const quote = await prisma.simpleQuote.findFirst({
      where: { id, projectId },
      include: { lines: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    res.json({ quote });
  } catch (e) { next(e); }
});

// ============================================
// 생성
// ============================================
const createSchema = z.object({
  title: z.string().trim().min(1).max(50).optional(),
  quoteDate: z.string().optional(),
  clientName: z.string().trim().max(200).optional(),
  projectName: z.string().trim().max(200).optional(),
  designFeeRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  templateKey: z.string().max(30).optional(),
  footerNotes: z.string().max(2000).optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const parsed = createSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    const input = parsed.data;

    const snapshot = await snapshotCompany(req.user.companyId);
    const { vatRate: _ignoreCompanyVat, ...supplierFields } = snapshot;

    // 같은 프로젝트의 기존 견적 개수 → 자동 title 제안
    const existingCount = await prisma.simpleQuote.count({ where: { projectId } });
    const autoTitle = existingCount === 0 ? '1차' : `${existingCount + 1}차`;

    const created = await prisma.simpleQuote.create({
      data: {
        projectId,
        title: input.title || autoTitle,
        quoteDate: input.quoteDate ? new Date(input.quoteDate) : new Date(),
        clientName: input.clientName ?? project.customerName ?? '',
        projectName: input.projectName ?? project.name ?? '',
        designFeeRate: input.designFeeRate ?? 10,
        vatRate: input.vatRate ?? 0, // 기본 0 — 부가세 별도 안내문이 표준
        templateKey: input.templateKey || 'classic',
        footerNotes: input.footerNotes ?? defaultFooter(),
        ...supplierFields,
      },
      include: { lines: true },
    });

    res.status(201).json({ quote: created });
  } catch (e) { next(e); }
});

function defaultFooter() {
  return [
    '1. 위 견적은 가견적서이므로 실제 디자인 계약 내용에 따라 금액이 달라질 수 있습니다.',
    '2. 현금영수증 및 세금계산서 발행시 부가세(10%) 별도이며 견적 외 공사는 추가금이 발생됩니다.',
  ].join('\n');
}

// ============================================
// 헤더 업데이트
// ============================================
const patchSchema = z.object({
  title: z.string().trim().min(1).max(50).optional(),
  status: z.enum(STATUSES).optional(),
  quoteDate: z.string().optional(),
  clientName: z.string().trim().max(200).optional(),
  projectName: z.string().trim().max(200).optional(),
  // 공급자 정보 — 보통 자동 스냅샷이지만 견적별 수동 수정 허용
  supplierName: z.string().trim().max(200).optional(),
  supplierRegNo: z.string().max(50).optional().nullable(),
  supplierOwner: z.string().max(50).optional().nullable(),
  supplierAddress: z.string().max(500).optional().nullable(),
  supplierTel: z.string().max(50).optional().nullable(),
  supplierEmail: z.string().max(200).optional().nullable(),
  supplierLogoUrl: z.string().max(500).optional().nullable(),
  // 합계 조정
  designFeeRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  roundAdjustment: z.number().optional(),
  templateKey: z.string().max(30).optional(),
  footerNotes: z.string().max(2000).optional().nullable(),
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.simpleQuote.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Quote not found' });

    const parsed = patchSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    const input = parsed.data;

    const data = { ...input };
    if (input.quoteDate) data.quoteDate = new Date(input.quoteDate);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.simpleQuote.update({ where: { id }, data });
      return recomputeQuote(tx, id);
    });

    const full = await prisma.simpleQuote.findUnique({
      where: { id },
      include: { lines: { orderBy: { orderIndex: 'asc' } } },
    });
    res.json({ quote: full });
  } catch (e) { next(e); }
});

// ============================================
// 삭제
// ============================================
router.delete('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.simpleQuote.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Quote not found' });

    await prisma.simpleQuote.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ============================================
// 라인 일괄 교체 (인라인 편집 → debounce 저장)
// ============================================
const lineSchema = z.object({
  isGroup: z.boolean().optional().default(false),
  isGroupEnd: z.boolean().optional().default(false),
  itemName: z.string().trim().max(200).default(''),
  spec: z.string().max(200).optional().nullable(),
  quantity: z.number().min(0).default(1),
  unit: z.string().max(20).optional().nullable(),
  unitPrice: z.number().min(0).default(0),
  notes: z.string().max(1000).optional().nullable(),
});
const linesSchema = z.object({
  lines: z.array(lineSchema).max(200),
});

// ============================================
// 다른 견적의 라인을 현재 견적에 복사 (append/replace)
//   POST /:id/import-lines  { sourceId, mode: 'append' | 'replace' }
// ============================================
const importSchema = z.object({
  sourceId: z.string().min(1),
  mode: z.enum(['append', 'replace']).default('append'),
});

router.post('/:id/import-lines', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const target = await prisma.simpleQuote.findFirst({ where: { id, projectId } });
    if (!target) return res.status(404).json({ error: 'Quote not found' });

    const parsed = importSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });
    const { sourceId, mode } = parsed.data;

    // 회사 내 견적인지 확인
    const source = await prisma.simpleQuote.findFirst({
      where: { id: sourceId, project: { companyId: req.user.companyId } },
      include: { lines: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!source) return res.status(404).json({ error: 'Source quote not found' });

    await prisma.$transaction(async (tx) => {
      let baseIndex = 0;
      if (mode === 'replace') {
        await tx.simpleQuoteLine.deleteMany({ where: { quoteId: id } });
      } else {
        const last = await tx.simpleQuoteLine.findFirst({
          where: { quoteId: id },
          orderBy: { orderIndex: 'desc' },
        });
        baseIndex = last ? last.orderIndex + 1 : 0;
      }
      if (source.lines.length > 0) {
        await tx.simpleQuoteLine.createMany({
          data: source.lines.map((l, i) => ({
            quoteId: id,
            orderIndex: baseIndex + i,
            isGroup: l.isGroup,
            isGroupEnd: l.isGroupEnd,
            itemName: l.itemName,
            spec: l.spec,
            quantity: l.quantity,
            unit: l.unit,
            unitPrice: l.unitPrice,
            amount: l.amount,
            notes: l.notes,
          })),
        });
      }
      await recomputeQuote(tx, id);
    });

    const full = await prisma.simpleQuote.findUnique({
      where: { id },
      include: { lines: { orderBy: { orderIndex: 'asc' } } },
    });
    res.json({ quote: full, importedCount: source.lines.length });
  } catch (e) { next(e); }
});

router.put('/:id/lines', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.simpleQuote.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Quote not found' });

    const parsed = linesSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });

    const lines = parsed.data.lines.map((l, idx) => {
      const isGroup = !!l.isGroup;
      const isGroupEnd = isGroup && !!l.isGroupEnd;
      return {
        isGroup,
        isGroupEnd,
        itemName: isGroupEnd ? '' : (l.itemName || ''),
        spec: isGroup ? null : (l.spec || null),
        quantity: isGroup ? 0 : l.quantity,
        unit: isGroup ? null : (l.unit || null),
        unitPrice: isGroup ? 0 : l.unitPrice,
        amount: isGroup ? 0 : Math.round(l.quantity * l.unitPrice),
        notes: isGroup ? null : (l.notes || null),
        orderIndex: idx,
      };
    });

    await prisma.$transaction(async (tx) => {
      await tx.simpleQuoteLine.deleteMany({ where: { quoteId: id } });
      if (lines.length > 0) {
        await tx.simpleQuoteLine.createMany({
          data: lines.map((l) => ({ ...l, quoteId: id })),
        });
      }
      await recomputeQuote(tx, id);
    });

    const full = await prisma.simpleQuote.findUnique({
      where: { id },
      include: { lines: { orderBy: { orderIndex: 'asc' } } },
    });
    res.json({ quote: full });
  } catch (e) { next(e); }
});

module.exports = router;
