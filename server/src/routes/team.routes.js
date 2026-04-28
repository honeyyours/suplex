const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired, requireRole } = require('../middlewares/auth');
const { audit } = require('../services/audit');

const router = express.Router();
router.use(authRequired);

const ROLES = ['OWNER', 'DESIGNER', 'FIELD'];

// GET /api/team/members  — 내 회사 멤버 목록
router.get('/members', async (req, res, next) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { companyId: req.user.companyId },
      include: {
        user: {
          select: { id: true, email: true, name: true, phone: true, createdAt: true },
        },
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    });
    const members = memberships.map((m) => ({
      membershipId: m.id,
      userId: m.user.id,
      email: m.user.email,
      name: m.user.name,
      phone: m.user.phone,
      role: m.role,
      joinedAt: m.createdAt,
    }));
    res.json({ members });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  role: z.enum(['OWNER', 'DESIGNER', 'FIELD']),
});

// POST /api/team/members  — OWNER가 직접 멤버 생성 (User + Membership)
router.post('/members', requireRole('OWNER'), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(409).json({ error: '이미 등록된 이메일입니다' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email.trim(),
          passwordHash,
          name: data.name.trim(),
          phone: data.phone?.trim() || null,
        },
      });
      const membership = await tx.membership.create({
        data: { userId: user.id, companyId: req.user.companyId, role: data.role },
      });
      return { user, membership };
    });

    audit(req, 'member.create', {
      targetType: 'USER', targetId: result.user.id,
      metadata: { email: result.user.email, role: data.role },
    });

    res.status(201).json({
      member: {
        membershipId: result.membership.id,
        userId: result.user.id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone,
        role: result.membership.role,
        joinedAt: result.membership.createdAt,
      },
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  role: z.enum(['OWNER', 'DESIGNER', 'FIELD']).optional(),
});

// PATCH /api/team/members/:userId  — 이름/전화/역할 변경
router.patch('/members/:userId', requireRole('OWNER'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = updateSchema.parse(req.body || {});

    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId: req.user.companyId } },
    });
    if (!membership) return res.status(404).json({ error: '멤버를 찾을 수 없습니다' });

    // 자기 자신 역할 변경 금지 (실수로 본인 권한 잃는 것 방지)
    if (data.role && userId === req.user.id && data.role !== 'OWNER') {
      return res.status(400).json({ error: '본인의 OWNER 권한은 직접 변경할 수 없습니다' });
    }

    // 마지막 OWNER 강등 금지
    if (data.role && membership.role === 'OWNER' && data.role !== 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: { companyId: req.user.companyId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        return res.status(400).json({ error: '마지막 OWNER는 강등할 수 없습니다' });
      }
    }

    await prisma.$transaction(async (tx) => {
      if (data.name !== undefined || data.phone !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(data.name !== undefined ? { name: data.name.trim() } : {}),
            ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
          },
        });
      }
      if (data.role !== undefined) {
        await tx.membership.update({
          where: { id: membership.id },
          data: { role: data.role },
        });
      }
    });

    const updated = await prisma.membership.findUnique({
      where: { id: membership.id },
      include: { user: { select: { id: true, email: true, name: true, phone: true, createdAt: true } } },
    });

    audit(req, 'member.update', {
      targetType: 'USER', targetId: userId,
      metadata: { email: updated.user.email, changes: data },
    });

    res.json({
      member: {
        membershipId: updated.id,
        userId: updated.user.id,
        email: updated.user.email,
        name: updated.user.name,
        phone: updated.user.phone,
        role: updated.role,
        joinedAt: updated.createdAt,
      },
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const passwordSchema = z.object({
  password: z.string().min(6),
});

// PATCH /api/team/members/:userId/password  — OWNER가 비번 리셋
router.patch('/members/:userId/password', requireRole('OWNER'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const data = passwordSchema.parse(req.body);

    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId: req.user.companyId } },
    });
    if (!membership) return res.status(404).json({ error: '멤버를 찾을 수 없습니다' });

    const passwordHash = await bcrypt.hash(data.password, 10);
    // tokenVersion++ 로 그 사용자의 모든 기존 세션 강제 로그아웃
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });

    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    audit(req, 'member.password-reset', { targetType: 'USER', targetId: userId, metadata: { email: u?.email } });

    res.json({ ok: true });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// DELETE /api/team/members/:userId  — 회사에서 제거 (Membership만 삭제, User는 유지)
router.delete('/members/:userId', requireRole('OWNER'), async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({ error: '본인은 제거할 수 없습니다' });
    }

    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId: req.user.companyId } },
    });
    if (!membership) return res.status(404).json({ error: '멤버를 찾을 수 없습니다' });

    if (membership.role === 'OWNER') {
      const ownerCount = await prisma.membership.count({
        where: { companyId: req.user.companyId, role: 'OWNER' },
      });
      if (ownerCount <= 1) {
        return res.status(400).json({ error: '마지막 OWNER는 제거할 수 없습니다' });
      }
    }

    const removedUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });

    // 멤버십 삭제 + tokenVersion++ 로 즉시 모든 세션 강제 로그아웃
    // (퇴사자가 현재 로그인 중이라도 다음 요청에서 401 → 자동 로그인 페이지로)
    await prisma.$transaction([
      prisma.membership.delete({ where: { id: membership.id } }),
      prisma.user.update({ where: { id: userId }, data: { tokenVersion: { increment: 1 } } }),
    ]);

    audit(req, 'member.remove', {
      targetType: 'USER', targetId: userId,
      metadata: { email: removedUser?.email, name: removedUser?.name, role: membership.role },
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
