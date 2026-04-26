// 회사가 사용 중인 공정(phase) 목록 — 빠른 추가 칩, popover, 드롭다운 등에서 사용.
// 공정 마스터 = PhaseKeywordRule + PhaseDeadlineRule + PhaseAdvice union (회사가 명시적으로 등록한 것만).
// DailyScheduleEntry.category는 사용 기록이지 마스터 데이터가 아니므로 제외 — 공정 삭제 시 칩에서도 사라져야 함.
// 회사 마스터가 비어 있으면 신규 회사로 보고 기본 10개 fallback.
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { invalidateCache } = require('../services/phaseDetect');

const router = express.Router();
router.use(authRequired);

// 기본 10개 — date.js의 CATEGORIES와 순서·내용 일치 유지
const DEFAULT_PHASES = [
  '철거', '목공', '전기', '설비', '타일', '도배', '도장', '필름', '마루', '준공',
];

async function fetchCompanyPhases(companyId) {
  const [keywordRules, deadlineRules, advices] = await Promise.all([
    prisma.phaseKeywordRule.findMany({ where: { companyId }, select: { phase: true }, distinct: ['phase'] }),
    prisma.phaseDeadlineRule.findMany({ where: { companyId }, select: { phase: true }, distinct: ['phase'] }),
    prisma.phaseAdvice.findMany({ where: { companyId }, select: { phase: true }, distinct: ['phase'] }),
  ]);
  const set = new Set();
  for (const r of keywordRules) if (r.phase) set.add(r.phase);
  for (const r of deadlineRules) if (r.phase) set.add(r.phase);
  for (const r of advices) if (r.phase) set.add(r.phase);
  return set;
}

// GET /api/phases  →  { phases: ['철거', '목공', ..., '조경'(추가분)] }
router.get('/', async (req, res, next) => {
  try {
    const fromCompany = await fetchCompanyPhases(req.user.companyId);
    if (fromCompany.size === 0) {
      return res.json({ phases: DEFAULT_PHASES });
    }
    // 기본 10개 중 회사에 있는 것 → 원래 순서, 그 외 추가분 → 가나다순
    const inDefaults = DEFAULT_PHASES.filter((p) => fromCompany.has(p));
    const extras = [...fromCompany].filter((p) => !DEFAULT_PHASES.includes(p)).sort((a, b) => a.localeCompare(b, 'ko'));
    res.json({ phases: [...inDefaults, ...extras] });
  } catch (e) {
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
