// 기능(Feature) 가드 미들웨어
// 사용 예: router.get('/expenses', requireFeature(F.EXPENSES_VIEW), handler)
// authRequired 다음에 와야 함 (req.user.role 사용).
const prisma = require('../config/prisma');
const { hasFeature } = require('../services/features');

function requireFeature(feature) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    // 회사 plan 조회 (베타엔 plan 필드 없을 수도 — null 허용)
    let plan = null;
    try {
      const company = await prisma.company.findUnique({
        where: { id: req.user.companyId },
        select: { plan: true },
      });
      plan = company?.plan || null;
    } catch (e) {
      // plan 컬럼이 schema에 아직 없을 때(베타) — 무시하고 ENTERPRISE 가정
      plan = null;
    }

    if (!hasFeature({ role: req.user.role, plan }, feature)) {
      return res.status(403).json({ error: 'Forbidden', feature });
    }
    next();
  };
}

module.exports = { requireFeature };
