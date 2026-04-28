// 감사 로그 헬퍼 — 어드민·OWNER 주요 액션 기록 (베타 7-A)
// 사용: await recordAudit(req, 'member.remove', { targetType: 'USER', targetId, metadata })
// fire-and-forget 권장: 응답 차단 X, 실패해도 메인 로직은 진행
const prisma = require('../config/prisma');

function actorTypeFor(user) {
  if (!user) return 'UNKNOWN';
  if (user.isSuperAdmin) return 'ADMIN';
  return user.role || 'USER';
}

async function recordAudit(req, action, opts = {}) {
  try {
    const actorId = opts.actorId || req?.user?.id;
    if (!actorId) return; // 로그인 안 됐으면 스킵
    await prisma.auditLog.create({
      data: {
        actorId,
        actorType: opts.actorType || actorTypeFor(req?.user),
        companyId: opts.companyId !== undefined ? opts.companyId : (req?.user?.companyId || null),
        action,
        targetType: opts.targetType || null,
        targetId: opts.targetId || null,
        metadata: opts.metadata || undefined,
        ip: req?.ip || (req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()) || null,
        userAgent: req?.headers?.['user-agent']?.slice(0, 500) || null,
      },
    });
  } catch (e) {
    // audit 실패는 메인 로직에 영향 X (best-effort)
    console.warn('[audit] failed:', action, e?.message);
  }
}

// fire-and-forget 변형 — await 없이 호출
function audit(req, action, opts = {}) {
  recordAudit(req, action, opts);
}

module.exports = { recordAudit, audit };
