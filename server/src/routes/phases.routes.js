// 표준 공정(척추) 25종 — 메모리 핵심결정 "표준 공정 라이브러리" 정책 (2026-04-28)
// closed enum: 회사가 마음대로 추가 X. 자유 텍스트 입력은 normalizePhase로 25개에 흡수.
// 매핑 실패 = OTHER(기타). 통합 기능(D-N 룰·자동 발주·AI비서 통합) 미작동.
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { requireFeature } = require('../middlewares/requireFeature');
const { F } = require('../services/features');
const { invalidateCache } = require('../services/phaseDetect');
const { STANDARD_PHASES, STANDARD_LABELS, resolvePhaseLabelMap } = require('../services/phases');

const router = express.Router();
router.use(authRequired);

// GET /api/phases — 표준 25개 + 회사 표시 라벨(alias). 회사가 추가 못 함.
// phaseLabels 컬럼이 prod DB에 아직 없는 환경에서도 표준 25개는 반드시 반환되도록 graceful fallback.
async function safeReadPhaseLabels(companyId) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { phaseLabels: true },
    });
    return company?.phaseLabels || {};
  } catch (e) {
    // P2022 (column does not exist) 또는 기타 — 마이그레이션 미적용 환경에서 안전하게 통과
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[phases] phaseLabels read failed (likely missing column):', e.code || e.message);
    }
    return {};
  }
}

router.get('/', async (req, res, next) => {
  try {
    const phaseLabelsRaw = await safeReadPhaseLabels(req.user.companyId);
    const labelMap = resolvePhaseLabelMap(phaseLabelsRaw);
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
    const phaseLabels = await safeReadPhaseLabels(req.user.companyId);
    res.json({ phaseLabels });
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
router.patch('/labels', requireFeature(F.SETTINGS_PHASE_LABELS), async (req, res, next) => {
  try {
    const { phaseLabels } = labelsSchema.parse(req.body || {});
    const cleaned = {};
    for (const [key, value] of Object.entries(phaseLabels)) {
      if (!STANDARD_KEYS.has(key)) continue;
      const trimmed = (value || '').trim();
      if (trimmed) cleaned[key] = trimmed;
    }
    try {
      const company = await prisma.company.update({
        where: { id: req.user.companyId },
        data: { phaseLabels: cleaned },
        select: { phaseLabels: true },
      });
      res.json({ phaseLabels: company.phaseLabels });
    } catch (e) {
      // 컬럼 미존재 환경 — 마이그레이션 안내
      if (e.code === 'P2022' || /phaseLabels/.test(e.message || '')) {
        return res.status(503).json({
          error: '서버 DB에 공정 라벨 컬럼이 아직 적용되지 않았습니다. 운영자가 마이그레이션 후 다시 시도해주세요.',
        });
      }
      throw e;
    }
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
