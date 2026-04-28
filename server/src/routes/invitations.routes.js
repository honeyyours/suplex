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
      // 이미 다른 회사 가입 유저 — 베타엔 막음 (정식 출시 시 다중 회사 합류 흐름 활성)
      return res.status(409).json({
        error: '이미 다른 회사에 가입된 이메일입니다. 정식 출시 후 다중 회사 합류가 가능합니다.',
      });
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
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// =========================================
// Public — 초대 토큰 조회·수락
// =========================================

// GET /api/invitations/by-token/:token — 회원가입 페이지에서 환영 정보 표시
router.get('/by-token/:token', async (req, res, next) => {
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
    res.json({
      companyName: inv.company.name,
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
    });
  } catch (e) { next(e); }
});

// POST /api/invitations/accept — 신규 가입 + 회사 합류
const acceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100),
  password: z.string().min(8),
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

    // 베타: 기존 유저는 막음 (다중 회사 합류는 베타 5번에서 풀림)
    const existingUser = await prisma.user.findUnique({ where: { email: inv.email } });
    if (existingUser) {
      return res.status(409).json({
        error: '이미 가입된 이메일입니다. 정식 출시 후 다중 회사 합류가 가능합니다.',
      });
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
      const membership = await tx.membership.create({
        data: { userId: user.id, companyId: inv.companyId, role: inv.role },
      });
      await tx.invitation.update({
        where: { id: inv.id },
        data: { acceptedAt: new Date() },
      });
      return { user, membership };
    });

    const token = jwt.sign(
      { sub: result.user.id, companyId: inv.companyId, role: inv.role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    res.status(201).json({
      token,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      company: { id: inv.company.id, name: inv.company.name, hideExpenses: inv.company.hideExpenses },
      role: inv.role,
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

module.exports = router;
