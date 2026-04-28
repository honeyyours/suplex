const jwt = require('jsonwebtoken');
const env = require('../config/env');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = {
      id: payload.sub,
      companyId: payload.companyId || null,
      role: payload.role || null,
      isSuperAdmin: !!payload.isSuperAdmin,
      impersonating: !!payload.impersonating,
      originalAdminId: payload.originalAdminId || null,
    };

    // 사칭(impersonation) 모드: 모든 write 차단 (READ-ONLY 강제)
    // 어드민이 지원·디버깅 위해 회사 화면 보는 동안 실수로 데이터 변경 방지
    if (req.user.impersonating && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
      return res.status(403).json({
        error: '사칭(임시 접속) 모드에서는 데이터를 변경할 수 없습니다 (READ-ONLY)',
        impersonating: true,
      });
    }
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

function requireSuperAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!req.user.isSuperAdmin) return res.status(403).json({ error: 'Super admin only' });
  next();
}

module.exports = { authRequired, requireRole, requireSuperAdmin };
