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
  // idempotent — 이미 인증된 요청이면 즉시 통과 (전역 미들웨어 + 하위 라우터 중복 호출 대비)
  if (req.user) return next();

  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  let payload;
  try {
    payload = jwt.verify(token, env.jwt.secret);
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // TOTP 1단계 임시 토큰은 일반 인증으로 통과 X — 오직 /auth/totp/verify에서만 사용
  if (payload.purpose === 'totp-pending') {
    return res.status(401).json({ error: 'TOTP not completed', needsTotp: true });
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

// 베타 진입 통제 — 회사가 APPROVED일 때만 통과.
// 슈퍼어드민은 우회 (어드민 콘솔 접근 항상 허용).
// 사용 위치: authRequired 다음, 회사 컨텍스트 필요한 모든 라우터에 적용.
async function requireApprovedCompany(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.isSuperAdmin) return next(); // 어드민은 우회
  if (!req.user.companyId) {
    // 회사 미선택 — /auth/me 등 일부 엔드포인트만 회사 없이 동작 가능. 그 외는 차단.
    return res.status(403).json({ error: 'No company context', code: 'NO_COMPANY' });
  }
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { approvalStatus: true },
    });
    if (!company) return res.status(403).json({ error: 'Company not found', code: 'NO_COMPANY' });
    if (company.approvalStatus !== 'APPROVED') {
      return res.status(403).json({
        error: '회사가 아직 승인되지 않았습니다',
        code: 'COMPANY_NOT_APPROVED',
        approvalStatus: company.approvalStatus,
      });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Approval check failed' });
  }
}

module.exports = { authRequired, requireRole, requireSuperAdmin, requireApprovedCompany };
