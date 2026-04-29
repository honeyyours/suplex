// 기능(Feature) 가드 미들웨어
// 사용 예: router.get('/expenses', requireFeature(F.EXPENSES_VIEW), handler)
// authRequired 다음에 와야 함 (req.user.role 사용).
//
// 판정 순서:
//   1. PLAN_FEATURES 잠금 — 어떤 경우에도 우회 불가
//   2. OWNER → ROLE_DEFAULTS만 적용 (UserPermission 토글 무시 — 사고 방지)
//   3. DESIGNER/FIELD → UserPermission 명시값 있으면 그 값, 없으면 ROLE_DEFAULTS
const prisma = require('../config/prisma');
const { hasFeature } = require('../services/features');

async function loadPermissionsMap(req) {
  if (!req.user || req.user.role === 'OWNER') return null;
  try {
    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId: req.user.id, companyId: req.user.companyId } },
      include: { permissions: { select: { feature: true, granted: true } } },
    });
    if (!membership) return null;
    const map = {};
    for (const p of membership.permissions) map[p.feature] = p.granted;
    return map;
  } catch (e) {
    // user_permissions 테이블 미존재(마이그 미적용) — 무시하고 ROLE_DEFAULTS로 폴백
    return null;
  }
}

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

    const permissions = await loadPermissionsMap(req);

    if (!hasFeature({ role: req.user.role, plan, permissions }, feature)) {
      return res.status(403).json({ error: 'Forbidden', feature });
    }
    next();
  };
}

module.exports = { requireFeature, loadPermissionsMap };
