const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/prisma');
const env = require('../config/env');

const router = express.Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  companyName: z.string().min(1),
  phone: z.string().optional(),
});

router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: '이미 가입된 이메일입니다' });

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({ data: { name: data.companyName } });
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
      company: { id: result.company.id, name: result.company.name },
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
      company: { id: membership.company.id, name: membership.company.name },
      role: membership.role,
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

module.exports = router;
