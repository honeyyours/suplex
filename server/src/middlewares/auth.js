const jwt = require('jsonwebtoken');
const env = require('../config/env');
const prisma = require('../config/prisma');

// lastSeenAt throttle (in-memory, 1분 단위)
// 정확한 시각은 ±1분 정도 — 어드민 모니터링 용도엔 충분, DB 부하 1/N 절감
const LAST_SEEN_THROTTLE_MS = 60 * 1000;
const lastSeenCache = new Map();

function maybeUpdateLastSeen(userId) {
  const now = Date.now();
  const prev = lastSeenCache.get(userId) || 0;
  if (now - prev < LAST_SEEN_THROTTLE_MS) return;
  lastSeenCache.set(userId, now);
  // fire-and-forget — 응답 차단 X
  prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date(now) },
  }).catch((e) => {
    console.warn('[auth] lastSeenAt update failed', e?.message);
  });
}

async function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // DB에서 사용자의 tokenVersion + isSuperAdmin fresh 조회 (사용자 삭제·강제 로그아웃 즉시 반영)
  let dbUser;
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, tokenVersion: true, isSuperAdmin: true },
    });
  } catch (e) {
    return res.status(500).json({ error: 'Auth check failed' });
  }
  if (!dbUser) return res.status(401).json({ error: 'User not found' });

  // tokenVersion 불일치 = 멤버 제거·비번 변경·강제 로그아웃 등으로 무효화된 토큰
  if ((dbUser.tokenVersion || 0) !== (payload.tv || 0)) {
    return res.status(401).json({ error: 'Token revoked', revoked: true });
  }

  req.user = {
    id: dbUser.id,
    companyId: payload.companyId || null,
    role: payload.role || null,
    // 사칭 모드에선 어드민 권한 무시 (대상 회사 OWNER로 동작)
    isSuperAdmin: payload.impersonating ? false : dbUser.isSuperAdmin,
    impersonating: !!payload.impersonating,
    originalAdminId: payload.originalAdminId || null,
  };

  // 사칭(impersonation) 모드: 모든 write 차단 (READ-ONLY 강제)
  if (req.user.impersonating && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return res.status(403).json({
      error: '사칭(임시 접속) 모드에서는 데이터를 변경할 수 없습니다 (READ-ONLY)',
      impersonating: true,
    });
  }

  if (!req.user.impersonating) {
    maybeUpdateLastSeen(req.user.id);
  }
  next();
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
