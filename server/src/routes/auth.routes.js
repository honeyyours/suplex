const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();

const signupSchema = z.object({
  // 개인 정보 (단계 1)
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().optional(),
  // 회사 정보 (단계 2) — 회사명만 필수, 나머지 견적 갑지·기본 정보로 미리 채움
  companyName: z.string().min(1),
  companyBizNumber: z.string().optional().nullable(),
  companyRepresentative: z.string().optional().nullable(),
  companyAddress: z.string().optional().nullable(),
  companyPhone: z.string().optional().nullable(),
  companyEmail: z.string().email().optional().nullable().or(z.literal('')),
});

router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: '이미 가입된 이메일입니다' });

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          bizNumber: data.companyBizNumber || null,
          representative: data.companyRepresentative || data.name, // 비어있으면 가입자 이름으로 미리 채움
          address: data.companyAddress || null,
          phone: data.companyPhone || null,
          email: data.companyEmail || data.email, // 비어있으면 가입 이메일로
        },
      });
      const user = await tx.user.create({
        data: {
          email: data.email,
          passwordHash,
          name: data.name,
          phone: data.phone,
        },
      });
      await tx.membership.create({
        data: { userId: user.id, companyId: company.id, role: 'OWNER' },
      });
      return { user, company };
    });

    const token = jwt.sign(
      { sub: result.user.id, companyId: result.company.id, role: 'OWNER' },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    res.status(201).json({
      token,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      company: { id: result.company.id, name: result.company.name, hideExpenses: result.company.hideExpenses },
      role: 'OWNER',
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { memberships: { include: { company: true } } },
    });
    if (!user) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });

    const membership = user.memberships[0];
    if (!membership) return res.status(403).json({ error: '소속된 회사가 없습니다' });

    const token = jwt.sign(
      { sub: user.id, companyId: membership.companyId, role: membership.role },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      company: { id: membership.company.id, name: membership.company.name, hideExpenses: membership.company.hideExpenses },
      role: membership.role,
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const updateMeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(40).nullable().optional(),
});

router.patch('/me', authRequired, async (req, res, next) => {
  try {
    const data = updateMeSchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, email: true, name: true, phone: true },
    });
    res.json({ user: updated });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// 본인 비밀번호 변경 (current 검증 후 new로 교체)
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.post('/change-password', authRequired, async (req, res, next) => {
  try {
    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, passwordHash: true },
    });
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

    const ok = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ error: '현재 비밀번호가 올바르지 않습니다' });

    if (data.currentPassword === data.newPassword) {
      return res.status(400).json({ error: '새 비밀번호가 현재 비밀번호와 동일합니다' });
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ ok: true });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

module.exports = router;
