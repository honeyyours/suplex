const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { audit } = require('../services/audit');
const { normalizePhase } = require('../services/phases');

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
  // 단수조정은 항상 차감 — 클라 입력에서 자동 음수화되어 저장됨.
  // 부가세 계산 일관성을 위해 공급가액 단계에서 가감 → 부가세는 (공급가액 + 단수조정) × 부가세율.
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
    '2. 세금계산서 발행 시 부가세(10%) 별도이며 견적 외 공사는 추가금이 발생됩니다.',
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

    // status가 ACCEPTED로 전이되면 자동으로 "수주 확정" 처리:
    //  - 같은 프로젝트의 다른 ACCEPTED 견적 → SUPERSEDED
    //  - 프로젝트.contractAmount = 견적 총액, contractVatRate = 견적 vatRate
    const becomingAccepted = input.status === 'ACCEPTED' && existing.status !== 'ACCEPTED';

    await prisma.$transaction(async (tx) => {
      await tx.simpleQuote.update({ where: { id }, data });
      const recomputed = await recomputeQuote(tx, id);

      if (becomingAccepted) {
        await tx.simpleQuote.updateMany({
          where: { projectId, status: 'ACCEPTED', id: { not: id } },
          data: { status: 'SUPERSEDED' },
        });
        const fresh = await tx.simpleQuote.findUnique({ where: { id } });
        const vatRate = Number(fresh.vatRate) || 0;
        await tx.project.update({
          where: { id: projectId },
          data: {
            contractAmount: recomputed.total,
            contractVatRate: vatRate > 0 ? vatRate : null,
          },
        });
      }
    });

    if (becomingAccepted) {
      audit(req, 'quote.confirm', {
        targetType: 'PROJECT', targetId: projectId,
        metadata: { quoteId: id, via: 'status-change' },
      });
    }

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
// 견적(SimpleQuote) → 마감재 탭으로 내보내기
//   POST /:id/send-to-materials
//   body: { selectedGroups?: string[] }   // 정규화 전 원본 그룹명 배열. 없으면 전체.
//
// 정책 (2026-05-14 재설계):
//  - 견적의 isGroup=true 헤더 → 마감재 `spaceGroup` (공간/공정).
//  - 그 그룹 내 isGroup=false 항목 → 그 spaceGroup 안의 Material row (itemName).
//    수량·단위·단가·메모(notes→memo)·spec 동반 이전.
//  - 그룹 헤더가 없는 평탄 견적(legacy) → 각 라인 itemName을 그룹으로 fallback (옛 동작).
//  - 그룹명은 normalizePhase로 정규화 (표준 25공정 매핑 시 표준 라벨, 미매핑은 원본 보존).
//  - selectedGroups가 주어지면 정규화 전 원본 그룹명 기준 필터.
//  - 항목 있는 그룹 → Material row 생성, 항목 없는 그룹 → pendingMaterialGroups에 추가.
//  - 중복: 같은 (projectId, spaceGroup, itemName) Material 행이 이미 있으면 skip.
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

    // 선택된 그룹 필터 (정규화 전 원본 그룹명 기준). 없거나 빈 배열이면 전체 허용.
    const rawSelected = Array.isArray(req.body?.selectedGroups) ? req.body.selectedGroups : null;
    const selectedSet = rawSelected && rawSelected.length > 0
      ? new Set(rawSelected.map((s) => String(s).trim()).filter(Boolean))
      : null; // null = 전체

    // 라인 파싱 — isGroup 추적해서 그룹 트리 구성
    // 평탄 견적(헤더 0개) 감지를 위해 hasAnyGroupHeader 추적
    const groupsMap = new Map(); // rawName(원본) → { rawName, items: [{itemName, quantity, unit, unitPrice, spec, memo}] }
    let currentRaw = null;
    let hasAnyGroupHeader = false;
    for (const l of quote.lines) {
      const raw = String(l.itemName || '').trim();
      if (l.isGroup) {
        if (l.isGroupEnd) {
          currentRaw = null;
          continue;
        }
        if (!raw) continue;
        hasAnyGroupHeader = true;
        currentRaw = raw;
        if (!groupsMap.has(raw)) groupsMap.set(raw, { rawName: raw, items: [] });
      } else {
        if (!raw) continue;
        if (!currentRaw) continue; // 그룹 외부 항목 (헤더 없는 영역) — fallback에서 처리
        const g = groupsMap.get(currentRaw);
        g.items.push({
          itemName: raw,
          quantity: l.quantity != null ? Number(l.quantity) : null,
          unit: l.unit || null,
          unitPrice: l.unitPrice != null ? Number(l.unitPrice) : null,
          spec: l.spec || null,
          memo: l.notes || null,
        });
      }
    }

    // 평탄 견적 fallback — 그룹 헤더가 하나도 없으면 각 라인 itemName을 그룹으로
    if (!hasAnyGroupHeader) {
      for (const l of quote.lines) {
        const raw = String(l.itemName || '').trim();
        if (!raw) continue;
        if (!groupsMap.has(raw)) groupsMap.set(raw, { rawName: raw, items: [] });
      }
    }

    if (groupsMap.size === 0) {
      return res.status(400).json({ error: '견적에 공정 라인이 없습니다.' });
    }

    // selectedGroups 필터 (원본명)
    const groups = Array.from(groupsMap.values()).filter((g) => {
      if (!selectedSet) return true;
      return selectedSet.has(g.rawName);
    });
    if (groups.length === 0) {
      return res.status(400).json({ error: '선택된 그룹이 없습니다.' });
    }

    // 정규화 라벨로 변환 (표준 25 매핑 시 표준 라벨, 아니면 원본)
    for (const g of groups) {
      const n = normalizePhase(g.rawName);
      g.spaceGroup = n.key === 'OTHER' ? g.rawName : n.label;
    }

    // 기존 Material/pending 충돌 확인 → 빈 그룹은 pending으로, 항목 있는 그룹은 Material row 생성
    const existingMaterials = await prisma.material.findMany({
      where: { projectId },
      select: { spaceGroup: true, itemName: true },
    });
    const existingGroupSet = new Set(existingMaterials.map((m) => m.spaceGroup));
    const existingPairSet = new Set(existingMaterials.map((m) => `${m.spaceGroup} ${m.itemName}`));

    const currentPending = Array.isArray(project.pendingMaterialGroups)
      ? project.pendingMaterialGroups
      : [];
    const pendingSet = new Set(currentPending.map((g) => g.name));

    const materialRowsToCreate = [];
    const addedPendingGroups = [];
    let skippedDuplicateItems = 0;

    // 같은 그룹 내 orderIndex 시작값 — 기존 최대값 + 1부터
    const maxOrderByGroup = new Map();
    if (existingMaterials.length > 0) {
      const maxRows = await prisma.material.groupBy({
        by: ['spaceGroup'],
        where: { projectId },
        _max: { orderIndex: true },
      });
      for (const r of maxRows) maxOrderByGroup.set(r.spaceGroup, r._max.orderIndex ?? -1);
    }

    for (const g of groups) {
      if (g.items.length === 0) {
        // 빈 그룹 → pending에 추가 (이미 Material 1개 이상 있거나 pending에 있으면 skip)
        if (!existingGroupSet.has(g.spaceGroup) && !pendingSet.has(g.spaceGroup)) {
          addedPendingGroups.push(g.spaceGroup);
          pendingSet.add(g.spaceGroup);
        }
      } else {
        // 항목 있는 그룹 → Material rows 생성
        let nextOrder = (maxOrderByGroup.get(g.spaceGroup) ?? -1) + 1;
        for (const it of g.items) {
          const pairKey = `${g.spaceGroup} ${it.itemName}`;
          if (existingPairSet.has(pairKey)) {
            skippedDuplicateItems++;
            continue;
          }
          existingPairSet.add(pairKey);
          const qty = it.quantity != null && Number.isFinite(it.quantity) ? it.quantity : null;
          const price = it.unitPrice != null && Number.isFinite(it.unitPrice) ? it.unitPrice : null;
          const total = qty != null && price != null ? qty * price : null;
          materialRowsToCreate.push({
            projectId,
            kind: 'FINISH',
            spaceGroup: g.spaceGroup,
            itemName: it.itemName,
            spec: it.spec,
            memo: it.memo,
            quantity: qty,
            unit: it.unit,
            unitPrice: price,
            totalPrice: total,
            orderIndex: nextOrder++,
          });
        }
        maxOrderByGroup.set(g.spaceGroup, nextOrder - 1);
        // 항목이 실제로 추가됐고 이 그룹이 pending에 남아있다면 pending에서 제거 (materials POST 핸들러와 동일 거동)
      }
    }

    // 트랜잭션 — pending 갱신 + Material 생성
    await prisma.$transaction(async (tx) => {
      if (materialRowsToCreate.length > 0) {
        await tx.material.createMany({ data: materialRowsToCreate });
      }

      // pending 목록 갱신: 새로 추가 + Material이 생긴 그룹 제거
      let next = currentPending.slice();
      if (addedPendingGroups.length > 0) {
        next = [...next, ...addedPendingGroups.map((name) => ({ name, kind: 'FINISH' }))];
      }
      if (materialRowsToCreate.length > 0) {
        const groupsWithNewMaterials = new Set(materialRowsToCreate.map((r) => r.spaceGroup));
        next = next.filter((g) => !groupsWithNewMaterials.has(g.name));
      }
      // 변경이 있을 때만 update
      if (
        addedPendingGroups.length > 0 ||
        next.length !== currentPending.length
      ) {
        await tx.project.update({
          where: { id: projectId },
          data: { pendingMaterialGroups: next },
        });
      }
    });

    res.json({
      quoteTitle: quote.title,
      addedItems: materialRowsToCreate.length,
      addedEmptyGroups: addedPendingGroups.length,
      addedEmptyGroupNames: addedPendingGroups,
      skippedDuplicateItems,
      processedGroups: groups.length,
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

// ============================================
// POST /:id/confirm — 견적 확정 + 프로젝트 contractAmount/contractVatRate 자동 채움
// 다른 ACCEPTED 견적은 SUPERSEDED로 자동 변경 (한 시점 1개만 ACCEPTED)
// ============================================
router.post('/:id/confirm', async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const id = req.params.id;

    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' });

    const quote = await prisma.simpleQuote.findFirst({
      where: { id, projectId },
      include: { lines: true },
    });
    if (!quote) return res.status(404).json({ error: '견적을 찾을 수 없습니다' });

    const totals = computeTotals(quote.lines, quote);
    const vatRate = Number(quote.vatRate) || 0;

    await prisma.$transaction([
      // 같은 프로젝트의 다른 ACCEPTED 견적은 SUPERSEDED로
      prisma.simpleQuote.updateMany({
        where: { projectId, status: 'ACCEPTED', id: { not: id } },
        data: { status: 'SUPERSEDED' },
      }),
      prisma.simpleQuote.update({
        where: { id },
        data: { status: 'ACCEPTED', ...totals },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: {
          contractAmount: totals.total,
          contractVatRate: vatRate > 0 ? vatRate : null,
        },
      }),
    ]);

    audit(req, 'quote.confirm', {
      targetType: 'PROJECT', targetId: projectId,
      metadata: { quoteId: id, total: totals.total, vatRate },
    });

    res.json({ ok: true, total: totals.total, vatRate, vatAmount: totals.vatAmount });
  } catch (e) { next(e); }
});

module.exports = router;
