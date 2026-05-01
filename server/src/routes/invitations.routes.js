// 팀원 초대 — 토큰 기반 가입 흐름 (베타 1번 작업)
// OWNER가 이메일·역할로 초대 생성 → 클립보드 복사 → 카톡 등으로 전달
// 받는 사람이 /invite/<token>으로 접속 → 이름·비번 설정 → 가입 + 회사 합류
const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { authRequired, requireRole } = require('../middlewares/auth');
const { audit } = require('../services/audit');
const { checkPasswordPolicy } = require('../services/passwordPolicy');
const { inviteTokenLimiter } = require('../middlewares/rateLimit');
const { grantIfCompanyApproved } = require('../services/lounge');

const router = express.Router();

const INVITE_TTL_DAYS = 7;

function genToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function inviteUrl(token) {
  const origin = Array.isArray(env.clientOrigin) ? env.clientOrigin[0] : env.clientOrigin;
  return `${origin}/invite/${token}`;
}

function sanitizeForSelf(inv) {
  return {
    id: inv.id,
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expiresAt,
    acceptedAt: inv.acceptedAt,
    createdAt: inv.createdAt,
    inviteUrl: inv.acceptedAt ? null : inviteUrl(inv.token),
    expired: !inv.acceptedAt && inv.expiresAt < new Date(),
  };
}

// =========================================
// OWNER 전용 — 초대 발송·조회·취소
// =========================================

// POST /api/invitations — 새 초대 발송
const createSchema = z.object({
  email: z.string().email(),
  role: z.enum(['DESIGNER', 'FIELD']), // OWNER는 초대로 만들지 않음 (멀티 OWNER 필요 시 PATCH로 승격)
});

router.post('/', authRequired, requireRole('OWNER'), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const email = data.email.trim().toLowerCase();

    // 1) 이미 회사에 같은 이메일 멤버가 있으면 거절
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMembership = await prisma.membership.findUnique({
        where: { userId_companyId: { userId: existingUser.id, companyId: req.user.companyId } },
      });
      if (existingMembership) {
        return res.status(409).json({ error: '이미 회사에 소속된 멤버입니다' });
      }
      // 이미 다른 회사 가입 유저 — 받는 사람이 로그인 후 합류하는 흐름 (POST /invitations/join)
    }

    // 2) 같은 이메일에 사용되지 않은 초대가 있으면 만료시켜서 마지막 발송만 유효하게
    await prisma.invitation.updateMany({
      where: {
        companyId: req.user.companyId,
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { expiresAt: new Date() },
    });

    const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const inv = await prisma.invitation.create({
      data: {
        companyId: req.user.companyId,
        email,
        role: data.role,
        token: genToken(),
        expiresAt,
      },
    });

    audit(req, 'invitation.create', {
      targetType: 'INVITATION', targetId: inv.id,
      metadata: { email, role: data.role },
    });

    res.status(201).json({ invitation: sanitizeForSelf(inv) });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// GET /api/invitations — 회사 발송 이력
router.get('/', authRequired, requireRole('OWNER'), async (req, res, next) => {
  try {
    const list = await prisma.invitation.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ invitations: list.map(sanitizeForSelf) });
  } catch (e) { next(e); }
});

// DELETE /api/invitations/:id — 초대 취소
router.delete('/:id', authRequired, requireRole('OWNER'), async (req, res, next) => {
  try {
    const inv = await prisma.invitation.findUnique({ where: { id: req.params.id } });
    if (!inv || inv.companyId !== req.user.companyId) {
      return res.status(404).json({ error: '초대를 찾을 수 없습니다' });
    }
    if (inv.acceptedAt) {
      return res.status(400).json({ error: '이미 수락된 초대는 취소할 수 없습니다' });
    }
    await prisma.invitation.delete({ where: { id: inv.id } });
    audit(req, 'invitation.cancel', { targetType: 'INVITATION', targetId: inv.id, metadata: { email: inv.email } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// =========================================
// Public — 초대 토큰 조회·수락
// =========================================

// GET /api/invitations/by-token/:token — 회원가입 페이지에서 환영 정보 표시
// userExists / hasOtherMemberships 플래그로 클라이언트가 3-way 분기:
//   userExists=false                          → 신규 가입 화면
//   userExists=true  & hasOtherMemberships=false → 좀비 케이스(비번 검증 후 합류)
//   userExists=true  & hasOtherMemberships=true  → "로그인 후 다시 클릭" 안내
router.get('/by-token/:token', inviteTokenLimiter, async (req, res, next) => {
  try {
    const inv = await prisma.invitation.findUnique({
      where: { token: req.params.token },
      include: { company: { select: { name: true } } },
    });
    if (!inv) return res.status(404).json({ error: '유효하지 않은 초대 링크입니다' });
    if (inv.acceptedAt) {
      return res.status(410).json({ error: '이미 사용된 초대 링크입니다' });
    }
    if (inv.expiresAt < new Date()) {
      return res.status(410).json({ error: '만료된 초대 링크입니다 (7일 경과). 대표님께 새 초대를 요청해주세요.' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: inv.email },
      select: { id: true, _count: { select: { memberships: true } } },
    });
    const userExists = !!existingUser;
    const hasOtherMemberships = userExists && existingUser._count.memberships > 0;

    res.json({
      companyName: inv.company.name,
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
      userExists,
      hasOtherMemberships,
    });
  } catch (e) { next(e); }
});

// POST /api/invitations/accept — 신규 가입 OR 좀비 사용자(멤버십 0개) 합류
//   1) User 없음            → 새로 가입 + 회사 합류 (name·password 필요)
//   2) User 있음 + 멤버십 0개 → 비밀번호 검증 후 멤버십만 추가 (좀비 복구. name 무시)
//   3) User 있음 + 멤버십≥1개 → 로그인 후 /join 흐름으로 안내 (현재 동작 유지)
const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().max(100).optional(), // 좀비 케이스엔 무시 (기존 user.name 유지)
  password: z.string().min(1), // 신규=새 비번(8자+), 좀비=기존 비번 검증
  phone: z.string().max(40).optional().nullable(),
});

router.post('/accept', async (req, res, next) => {
  try {
    const data = acceptSchema.parse(req.body);

    const inv = await prisma.invitation.findUnique({
      where: { token: data.token },
      include: { company: { select: { id: true, name: true, hideExpenses: true } } },
    });
    if (!inv) return res.status(404).json({ error: '유효하지 않은 초대 링크입니다' });
    if (inv.acceptedAt) return res.status(410).json({ error: '이미 사용된 초대 링크입니다' });
    if (inv.expiresAt < new Date()) return res.status(410).json({ error: '만료된 초대 링크입니다' });

    const existingUser = await prisma.user.findUnique({
      where: { email: inv.email },
      include: { _count: { select: { memberships: true } } },
    });

    let resultUser;
    let auditAction;

    if (existingUser && existingUser._count.memberships > 0) {
      // 다른 회사 멤버십 보유 — /join 흐름으로 (로그인 후 합류)
      return res.status(409).json({
        error: '이미 가입된 이메일입니다. 로그인 후 초대 링크를 다시 클릭해 합류해주세요.',
        code: 'EXISTING_USER',
      });
    }

    if (existingUser) {
      // 좀비 케이스 — 멤버십 0개 (회사 삭제 등으로 모든 멤버십이 cascade로 사라진 상태).
      // 본인 비번 검증으로 신원 확인 후 멤버십만 추가 (User·name·passwordHash 그대로).
      const ok = await bcrypt.compare(data.password, existingUser.passwordHash);
      if (!ok) {
        return res.status(401).json({ error: '비밀번호가 올바르지 않습니다' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.membership.create({
          data: { userId: existingUser.id, companyId: inv.companyId, role: inv.role },
        });
        await tx.invitation.update({
          where: { id: inv.id },
          data: { acceptedAt: new Date() },
        });
        // phone이 비어있고 사용자가 추가로 입력했으면 보강 (선택)
        if (data.phone?.trim() && !existingUser.phone) {
          await tx.user.update({
            where: { id: existingUser.id },
            data: { phone: data.phone.trim() },
          });
        }
        // 라운지 멤버십 — 회사가 APPROVED일 때만 부여 (퇴사 후에도 유지)
        await grantIfCompanyApproved(tx, existingUser.id, inv.companyId, '초대 합류 (좀비 복구)');
      });
      resultUser = existingUser;
      auditAction = 'invitation.accept-recover'; // 좀비 복구 케이스
    } else {
      // 신규 가입 + 합류
      if (!data.name?.trim()) {
        return res.status(400).json({ error: '이름을 입력해주세요' });
      }
      const policyErr = checkPasswordPolicy(data.password);
      if (policyErr) {
        return res.status(400).json({ error: policyErr });
      }

      const passwordHash = await bcrypt.hash(data.password, 10);
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: inv.email,
            passwordHash,
            name: data.name.trim(),
            phone: data.phone?.trim() || null,
          },
        });
        await tx.membership.create({
          data: { userId: user.id, companyId: inv.companyId, role: inv.role },
        });
        await tx.invitation.update({
          where: { id: inv.id },
          data: { acceptedAt: new Date() },
        });
        // 라운지 멤버십 — 회사가 APPROVED일 때만
        await grantIfCompanyApproved(tx, user.id, inv.companyId, '초대 신규 가입');
        return user;
      });
      resultUser = result;
      auditAction = 'invitation.accept';
    }

    // 토큰 발급 (좀비 복구 케이스도 본인 tokenVersion 유지)
    const fresh = await prisma.user.findUnique({
      where: { id: resultUser.id },
      select: { tokenVersion: true, isSuperAdmin: true },
    });
    const token = jwt.sign(
      {
        sub: resultUser.id,
        companyId: inv.companyId,
        role: inv.role,
        isSuperAdmin: fresh?.isSuperAdmin || false,
        tv: fresh?.tokenVersion || 0,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    audit(
      { user: { id: resultUser.id, role: inv.role }, headers: req.headers, ip: req.ip },
      auditAction,
      { companyId: inv.companyId, targetType: 'USER', targetId: resultUser.id, metadata: { email: inv.email, role: inv.role } }
    );

    res.status(201).json({
      token,
      user: { id: resultUser.id, email: resultUser.email, name: resultUser.name },
      company: { id: inv.company.id, name: inv.company.name, hideExpenses: inv.company.hideExpenses },
      role: inv.role,
      permissions: {}, // 신규 가입·좀비 복구 — 명시 토글 없음, ROLE_DEFAULTS 따름
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// POST /api/invitations/join — 이미 로그인된 유저가 초대받은 회사에 합류
// 응답으로 새 회사 컨텍스트 토큰 반환 (자동 전환). authRequired 필요.
const joinSchema = z.object({ token: z.string().min(1) });

router.post('/join', authRequired, async (req, res, next) => {
  try {
    const data = joinSchema.parse(req.body);

    const inv = await prisma.invitation.findUnique({
      where: { token: data.token },
      include: { company: { select: { id: true, name: true, hideExpenses: true } } },
    });
    if (!inv) return res.status(404).json({ error: '유효하지 않은 초대 링크입니다' });
    if (inv.acceptedAt) return res.status(410).json({ error: '이미 사용된 초대 링크입니다' });
    if (inv.expiresAt < new Date()) return res.status(410).json({ error: '만료된 초대 링크입니다' });

    // 로그인된 유저의 이메일과 초대 이메일 일치 검증 (보안: 다른 사람의 초대 가로채기 방지)
    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, tokenVersion: true, isSuperAdmin: true },
    });
    if (!me) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    if (me.email.toLowerCase() !== inv.email.toLowerCase()) {
      return res.status(403).json({
        error: `이 초대는 ${inv.email} 으로 발송되었습니다. 해당 이메일로 로그인해주세요.`,
      });
    }

    // 이미 같은 회사 멤버인지 확인
    const existing = await prisma.membership.findUnique({
      where: { userId_companyId: { userId: me.id, companyId: inv.companyId } },
    });
    if (existing) {
      return res.status(409).json({ error: '이미 이 회사에 소속되어 있습니다' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.membership.create({
        data: { userId: me.id, companyId: inv.companyId, role: inv.role },
      });
      await tx.invitation.update({
        where: { id: inv.id },
        data: { acceptedAt: new Date() },
      });
      // 라운지 멤버십 — 회사가 APPROVED일 때만
      await grantIfCompanyApproved(tx, me.id, inv.companyId, '초대 합류 (로그인 후)');
    });

    // 새 회사 컨텍스트 토큰 발급 (자동 전환)
    const token = jwt.sign(
      {
        sub: me.id,
        companyId: inv.companyId,
        role: inv.role,
        isSuperAdmin: me.isSuperAdmin,
        tv: me.tokenVersion || 0,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    audit(req, 'invitation.join', {
      companyId: inv.companyId, targetType: 'USER', targetId: me.id,
      metadata: { email: me.email, role: inv.role },
    });

    res.status(201).json({
      token,
      user: { id: me.id, email: me.email, name: me.name },
      company: { id: inv.company.id, name: inv.company.name, hideExpenses: inv.company.hideExpenses },
      role: inv.role,
      permissions: {}, // 새 회사 합류 — 명시 토글 없음
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

module.exports = router;
