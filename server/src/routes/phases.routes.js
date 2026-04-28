// 표준 공정(척추) 25종 — 메모리 핵심결정 "표준 공정 라이브러리" 정책 (2026-04-28)
// closed enum: 회사가 마음대로 추가 X. 자유 텍스트 입력은 normalizePhase로 25개에 흡수.
// 매핑 실패 = OTHER(기타). 통합 기능(D-N 룰·자동 발주·AI비서 통합) 미작동.
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired, requireRole } = require('../middlewares/auth');
const { invalidateCache } = require('../services/phaseDetect');
const { STANDARD_PHASES, STANDARD_LABELS, resolvePhaseLabelMap } = require('../services/phases');

const router = express.Router();
router.use(authRequired);

// GET /api/phases — 표준 25개 + 회사 표시 라벨(alias). 회사가 추가 못 함.
router.get('/', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { phaseLabels: true },
    });
    const labelMap = resolvePhaseLabelMap(company?.phaseLabels);
    res.json({
      phases: STANDARD_LABELS,
      // 자세한 메타 + 회사 표시 라벨 (UI 드롭다운/표시용)
      detail: STANDARD_PHASES.map((p) => ({
        key: p.key,
        label: p.label,
        displayLabel: labelMap[p.label] || p.label,
        order: p.order,
        hint: p.hint || null,
      })),
      // 표준라벨 → 회사 표시라벨 (빠른 룩업)
      labelMap,
    });
  } catch (e) {
    next(e);
  }
});

// GET /api/phases/labels — 회사 phase alias raw map (key → custom label, 비어있으면 미설정)
router.get('/labels', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { phaseLabels: true },
    });
    res.json({ phaseLabels: company?.phaseLabels || {} });
  } catch (e) {
    next(e);
  }
});

// PATCH /api/phases/labels — OWNER만. body: { phaseLabels: { KEY: "표시명" or "" } }
// 빈 문자열/누락 KEY는 라벨 미설정 처리. 25개 표준 KEY 외는 무시.
const STANDARD_KEYS = new Set(STANDARD_PHASES.map((p) => p.key));
const labelsSchema = z.object({
  phaseLabels: z.record(z.string(), z.string().nullable()).default({}),
});
router.patch('/labels', requireRole('OWNER'), async (req, res, next) => {
  try {
    const { phaseLabels } = labelsSchema.parse(req.body || {});
    const cleaned = {};
    for (const [key, value] of Object.entries(phaseLabels)) {
      if (!STANDARD_KEYS.has(key)) continue;
      const trimmed = (value || '').trim();
      if (trimmed) cleaned[key] = trimmed;
    }
    const company = await prisma.company.update({
      where: { id: req.user.companyId },
      data: { phaseLabels: cleaned },
      select: { phaseLabels: true },
    });
    res.json({ phaseLabels: company.phaseLabels });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// DELETE /api/phases/:phase — 회사 마스터에서 해당 공정 cascade 삭제 (키워드/D-N/어드바이스).
// 일정 entries category는 보존 (역사 기록).
router.delete('/:phase', async (req, res, next) => {
  try {
    const phase = decodeURIComponent(req.params.phase || '').trim();
    if (!phase) return res.status(400).json({ error: 'phase required' });

    const companyId = req.user.companyId;
    const result = await prisma.$transaction(async (tx) => {
      const k = await tx.phaseKeywordRule.deleteMany({ where: { companyId, phase } });
      const d = await tx.phaseDeadlineRule.deleteMany({ where: { companyId, phase } });
      const a = await tx.phaseAdvice.deleteMany({ where: { companyId, phase } });
      return { keywords: k.count, deadlines: d.count, advices: a.count };
    });
    invalidateCache(companyId);
    res.json({ ok: true, deleted: result });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
