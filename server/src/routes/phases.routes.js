// 회사가 사용 중인 공정(phase) 목록 — 빠른 추가 칩, popover, 드롭다운 등에서 사용.
// 기본 10개 + 회사가 추가한 phase(키워드/딜라인/어드바이스/일정 entry 등 모든 출처) union.
const express = require('express');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

// 기본 10개 — date.js의 CATEGORIES와 순서·내용 일치 유지
const DEFAULT_PHASES = [
  '철거', '목공', '전기', '설비', '타일', '도배', '도장', '필름', '마루', '준공',
];

// GET /api/phases  →  { phases: ['철거', '목공', ..., '조경'(추가분)] }
router.get('/', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    const [keywordRules, deadlineRules, advices, scheduleCats] = await Promise.all([
      prisma.phaseKeywordRule.findMany({ where: { companyId }, select: { phase: true }, distinct: ['phase'] }),
      prisma.phaseDeadlineRule.findMany({ where: { companyId }, select: { phase: true }, distinct: ['phase'] }),
      prisma.phaseAdvice.findMany({ where: { companyId }, select: { phase: true }, distinct: ['phase'] }),
      prisma.dailyScheduleEntry.findMany({
        where: { project: { companyId }, category: { not: null } },
        select: { category: true },
        distinct: ['category'],
      }),
    ]);

    const fromCompany = new Set();
    for (const r of keywordRules) if (r.phase) fromCompany.add(r.phase);
    for (const r of deadlineRules) if (r.phase) fromCompany.add(r.phase);
    for (const r of advices) if (r.phase) fromCompany.add(r.phase);
    for (const r of scheduleCats) if (r.category) fromCompany.add(r.category);

    // 기본 10개 우선, 그 외 추가분은 가나다순
    const extras = [...fromCompany].filter((p) => !DEFAULT_PHASES.includes(p)).sort((a, b) => a.localeCompare(b, 'ko'));
    const phases = [...DEFAULT_PHASES, ...extras];

    res.json({ phases });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
