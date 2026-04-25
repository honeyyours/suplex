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

// AI 응답에서 마크다운 잔재를 제거 (** 굵게 / * 기울임 / ## 헤더 / `코드` / [] / > 인용 등)
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '· ')
    .replace(/`([^`\n]+)`/g, '$1')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^[─━=]{3,}$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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
// 견적의 공정(라인) → 마감재 탭의 그룹(spaceGroup)으로 자동 변환
//   POST /:id/send-to-materials
// 동작:
//  - 견적의 isGroup=false 라인의 itemName을 spaceGroup 후보로 모음 (중복 제거, 공백 제외)
//  - 같은 프로젝트 마감재의 기존 spaceGroup과 비교 → 새 그룹만 추가
//  - 각 새 그룹마다 placeholder Material 1개 생성 (itemName="(미정)")
//    → 그래야 마감재 탭 사이드바에 그룹이 노출됨
// ============================================
router.post('/:id/send-to-materials', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const quote = await prisma.simpleQuote.findFirst({
      where: { id, projectId },
      include: { lines: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    // 견적 공정 후보 (isGroup=false, itemName 비어있지 않음, 중복 제거, 입력 순서 유지)
    const seen = new Set();
    const candidates = [];
    for (const l of quote.lines) {
      if (l.isGroup) continue;
      const name = String(l.itemName || '').trim();
      if (!name) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      candidates.push(name);
    }
    if (candidates.length === 0) {
      return res.status(400).json({ error: '견적에 공정 라인이 없습니다.' });
    }

    // 기존 spaceGroup 목록
    const existing = await prisma.material.findMany({
      where: { projectId },
      select: { spaceGroup: true },
      distinct: ['spaceGroup'],
    });
    const existingSet = new Set(existing.map((m) => m.spaceGroup));

    const toAdd = candidates.filter((g) => !existingSet.has(g));
    if (toAdd.length === 0) {
      return res.json({ added: 0, skipped: candidates.length, total: candidates.length });
    }

    // placeholder Material 1개씩 (디자이너가 클릭해서 채움)
    const created = await prisma.$transaction(async (tx) => {
      let baseOrder = 0;
      const lastOrder = await tx.material.findFirst({
        where: { projectId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });
      baseOrder = lastOrder ? lastOrder.orderIndex + 1 : 0;

      const rows = toAdd.map((g, i) => ({
        projectId,
        kind: 'FINISH',
        spaceGroup: g,
        itemName: '(미정)',
        orderIndex: baseOrder + i,
      }));
      const c = await tx.material.createMany({ data: rows });

      // 이력 — 어떤 견적에서 왔는지 기록
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
          newValue: `(견적→마감재) "${quote.title}" / 공정 "${m.spaceGroup}"`,
        })),
      });
      return c.count;
    });

    res.json({
      added: created,
      skipped: candidates.length - toAdd.length,
      total: candidates.length,
      addedNames: toAdd,
    });
  } catch (e) { next(e); }
});

// ============================================
// 같은 프로젝트 내 견적 복제 — 헤더 + 라인까지 모두 복사 후 새 차수 생성
//   POST /:id/duplicate
// ============================================
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const source = await prisma.simpleQuote.findFirst({
      where: { id, projectId },
      include: { lines: { orderBy: { orderIndex: 'asc' } } },
    });
    if (!source) return res.status(404).json({ error: 'Quote not found' });

    // 자동 title — 끝 숫자 + 1, 없으면 existingCount+1차
    const existingCount = await prisma.simpleQuote.count({ where: { projectId } });
    let nextTitle;
    const m = source.title && source.title.match(/^(.*?)(\d+)(\D*)$/);
    if (m) {
      nextTitle = `${m[1]}${Number(m[2]) + 1}${m[3]}`;
    } else {
      nextTitle = `${existingCount + 1}차`;
    }

    const created = await prisma.$transaction(async (tx) => {
      const newQuote = await tx.simpleQuote.create({
        data: {
          projectId,
          title: nextTitle,
          status: 'DRAFT',
          quoteDate: new Date(),
          // 헤더 스냅샷
          supplierName: source.supplierName,
          supplierRegNo: source.supplierRegNo,
          supplierOwner: source.supplierOwner,
          supplierAddress: source.supplierAddress,
          supplierTel: source.supplierTel,
          supplierEmail: source.supplierEmail,
          supplierLogoUrl: source.supplierLogoUrl,
          clientName: source.clientName,
          projectName: source.projectName,
          designFeeRate: source.designFeeRate,
          vatRate: source.vatRate,
          roundAdjustment: source.roundAdjustment,
          templateKey: source.templateKey,
          footerNotes: source.footerNotes,
        },
      });
      if (source.lines.length > 0) {
        await tx.simpleQuoteLine.createMany({
          data: source.lines.map((l, i) => ({
            quoteId: newQuote.id,
            orderIndex: i,
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
      // 원본을 SUPERSEDED로 — 단, 이미 ACCEPTED인 경우는 그대로 유지 (수주 확정 견적은 아카이브 가치)
      if (source.status !== 'ACCEPTED') {
        await tx.simpleQuote.update({
          where: { id: source.id },
          data: { status: 'SUPERSEDED' },
        });
      }
      await recomputeQuote(tx, newQuote.id);
      return newQuote;
    });

    const full = await prisma.simpleQuote.findUnique({
      where: { id: created.id },
      include: { lines: { orderBy: { orderIndex: 'asc' } } },
    });
    res.status(201).json({ quote: full, sourceId: id });
  } catch (e) { next(e); }
});

// ============================================
// AI 차이 비교 — 두 견적의 변경사항을 한국어로 요약
//   POST /:id/compare  { previousId }
// ============================================
const compareSchema = z.object({
  previousId: z.string().min(1),
});

router.post('/:id/compare', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const parsed = compareSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: 'Invalid input', details: parsed.error.format() });

    const [current, previous] = await Promise.all([
      prisma.simpleQuote.findFirst({
        where: { id, projectId },
        include: { lines: { orderBy: { orderIndex: 'asc' } } },
      }),
      prisma.simpleQuote.findFirst({
        where: { id: parsed.data.previousId, project: { companyId: req.user.companyId } },
        include: { lines: { orderBy: { orderIndex: 'asc' } } },
      }),
    ]);
    if (!current) return res.status(404).json({ error: 'Current quote not found' });
    if (!previous) return res.status(404).json({ error: 'Previous quote not found' });

    const formatLines = (q) =>
      q.lines
        .map((l) => {
          if (l.isGroup && l.isGroupEnd) return '── 그룹 종료';
          if (l.isGroup) return `▸ [그룹] ${l.itemName}`;
          const amt = Math.round(Number(l.quantity) * Number(l.unitPrice));
          return `  ${l.itemName} | ${Number(l.quantity)}${l.unit || ''} × ${Number(l.unitPrice).toLocaleString('ko-KR')} = ${amt.toLocaleString('ko-KR')}원${l.notes ? ` | 비고: ${l.notes}` : ''}`;
        })
        .join('\n');

    const diffYen = Number(current.total) - Number(previous.total);
    const diffSign = diffYen > 0 ? '+' : (diffYen < 0 ? '-' : '');
    const diffAbs = Math.abs(diffYen).toLocaleString('ko-KR');
    const prevTotalStr = Number(previous.total).toLocaleString('ko-KR');
    const currTotalStr = Number(current.total).toLocaleString('ko-KR');

    const userMsg = `너는 인테리어 견적서 변경사항 요약 전문가야. 아래 두 견적을 비교해서 정해진 형식으로만 출력해.

【이전 견적】 "${previous.title}" / 합계 ${prevTotalStr}원
${formatLines(previous)}

【새 견적】 "${current.title}" / 합계 ${currTotalStr}원
${formatLines(current)}

[필수 출력 형식 — 아래 템플릿 그대로, 줄 순서 유지]
※ 직전 차수 변경 요약 (${previous.title} → ${current.title})
· 추가: {추가된 항목들을 "항목명 +금액원" 형식으로 콤마 구분, 없으면 "없음"}
· 삭제: {삭제된 항목들을 "항목명 -금액원" 형식, 없으면 "없음"}
· 단가/수량 변경: {변경된 항목 "항목명 변경전→변경후" 형식, 없으면 "없음"}
· 그룹 구조 변경: {추가/삭제된 그룹명, 없으면 "없음"}
· 총 차이: ${diffSign}${diffAbs}원 (${prevTotalStr} → ${currTotalStr})

[엄격 규칙 — 반드시 지킬 것]
1. 마크다운 기호(**, ##, ---, \`, [], > 등) 절대 사용 금지. 일반 텍스트만.
2. 위 템플릿의 줄 5개를 정확히 출력. 추가 인사말/도입부/마무리 절대 없음.
3. 각 항목 내용이 길어도 한 줄로. 콤마(,)로 구분.
4. 금액은 천 단위 콤마, 마지막에 "원" 붙임.
5. 그룹 헤더(▸)는 "구조 변경" 줄에서만 다룸. "추가/삭제/변경"에는 일반 라인만.`;

    const env = require('../config/env');
    if (!env.anthropic?.apiKey) {
      return res.status(503).json({ error: 'AI service not configured' });
    }
    const AnthropicMod = require('@anthropic-ai/sdk');
    const Anthropic = AnthropicMod.default || AnthropicMod;
    const client = new Anthropic({ apiKey: env.anthropic.apiKey });
    const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: userMsg }],
    });
    const raw = response.content
      ?.filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    // 마크다운 잔재 제거 (** ## --- ` [] > 등)
    const summary = stripMarkdown(raw || '');

    res.json({
      summary: summary || '(요약을 생성하지 못했습니다)',
      previousTitle: previous.title,
      currentTitle: current.title,
      previousTotal: Number(previous.total),
      currentTotal: Number(current.total),
      diff: Number(current.total) - Number(previous.total),
    });
  } catch (e) {
    console.error('[simple-quote compare]', e);
    next(e);
  }
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
