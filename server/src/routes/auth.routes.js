const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { authRequired } = require('../middlewares/auth');
const { audit } = require('../services/audit');
const { buildSeedRows: buildPhaseKeywordSeedRows } = require('../services/phaseKeywordSeed');
const { ensureSystemDefaultsForCompany } = require('../services/standardPhaseAdvices');

const router = express.Router();

// 멤버십의 UserPermission을 { feature: bool } 맵으로 (graceful fallback: 테이블 미존재 환경 OK).
async function loadPermissionMap(membershipId) {
  if (!membershipId) return {};
  try {
    const rows = await prisma.userPermission.findMany({
      where: { membershipId },
      select: { feature: true, granted: true },
    });
    const map = {};
    for (const r of rows) map[r.feature] = r.granted;
    return map;
  } catch (e) {
    // user_permissions 테이블 미존재(prod 마이그 미적용) — 빈 맵 폴백
    return {};
  }
}

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
      // 표준 25개 phase 기본 키워드 자동 시드 — 일정 자동 인식이 즉시 작동하도록
      const seedRows = buildPhaseKeywordSeedRows().map((r) => ({ ...r, companyId: company.id }));
      await tx.phaseKeywordRule.createMany({ data: seedRows, skipDuplicates: true });
      // 시스템 룰(미확정 알림 D-14/D-7) 자동 보장 — 사용자 액션 없이 항상 들어가 있도록
      await ensureSystemDefaultsForCompany(tx, company.id);
      return { user, company };
    });

    const token = jwt.sign(
      { sub: result.user.id, companyId: result.company.id, role: 'OWNER', tv: 0 },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    audit({ user: { id: result.user.id, role: 'OWNER' }, headers: req.headers, ip: req.ip }, 'auth.signup', {
      companyId: result.company.id,
      targetType: 'COMPANY',
      targetId: result.company.id,
      metadata: { companyName: result.company.name },
    });

    res.status(201).json({
      token,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      company: { id: result.company.id, name: result.company.name, hideExpenses: result.company.hideExpenses },
      role: 'OWNER',
      permissions: {}, // OWNER는 토글 무시 — 항상 ROLE_DEFAULTS
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
      include: {
        memberships: {
          include: {
            // 명시 select — phaseLabels 같이 prod에 미반영된 컬럼이 있을 때 fallback 안전
            company: { select: { id: true, name: true, hideExpenses: true } },
          },
        },
      },
    });
    if (!user) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다' });

    const membership = user.memberships[0];

    // 일반 사용자는 회사 멤버십 필요. 슈퍼 어드민은 회사 없이도 로그인 OK.
    if (!membership && !user.isSuperAdmin) {
      return res.status(403).json({ error: '소속된 회사가 없습니다' });
    }

    const token = jwt.sign(
      {
        sub: user.id,
        companyId: membership?.companyId || null,
        role: membership?.role || null,
        isSuperAdmin: user.isSuperAdmin,
        tv: user.tokenVersion || 0,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    audit(
      { user: { id: user.id, isSuperAdmin: user.isSuperAdmin, role: membership?.role }, headers: req.headers, ip: req.ip },
      'auth.login',
      { companyId: membership?.companyId || null }
    );

    const permissions = membership ? await loadPermissionMap(membership.id) : {};

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
      company: membership
        ? { id: membership.company.id, name: membership.company.name, hideExpenses: membership.company.hideExpenses }
        : null,
      role: membership?.role || null,
      isSuperAdmin: user.isSuperAdmin,
      permissions,
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

// GET /api/auth/me — 현재 사용자 + 모든 회사 멤버십 (다중 회사 전환용)
router.get('/me', authRequired, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          include: { company: { select: { id: true, name: true, hideExpenses: true } } },
        },
      },
    });
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

    // 현재 회사 멤버십 권한 — 클라이언트 hasFeature 즉시 판정용
    const currentMembership = user.memberships.find((m) => m.companyId === req.user.companyId);
    const permissions = currentMembership ? await loadPermissionMap(currentMembership.id) : {};

    res.json({
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, isSuperAdmin: user.isSuperAdmin },
      memberships: user.memberships.map((m) => ({
        companyId: m.companyId,
        companyName: m.company.name,
        hideExpenses: m.company.hideExpenses,
        role: m.role,
      })),
      current: { companyId: req.user.companyId, role: req.user.role, isSuperAdmin: !!req.user.isSuperAdmin },
      permissions,
    });
  } catch (e) { next(e); }
});

// POST /api/auth/switch-company — 다른 회사로 JWT 재발급
const switchSchema = z.object({ companyId: z.string().min(1) });

router.post('/switch-company', authRequired, async (req, res, next) => {
  try {
    const data = switchSchema.parse(req.body);

    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId: req.user.id, companyId: data.companyId } },
      include: { company: { select: { id: true, name: true, hideExpenses: true } } },
    });
    if (!membership) {
      return res.status(403).json({ error: '소속되지 않은 회사입니다' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, tokenVersion: true, isSuperAdmin: true },
    });

    const token = jwt.sign(
      {
        sub: user.id,
        companyId: membership.companyId,
        role: membership.role,
        isSuperAdmin: user.isSuperAdmin,
        tv: user.tokenVersion || 0,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    const permissions = await loadPermissionMap(membership.id);

    res.json({
      token,
      user,
      company: {
        id: membership.company.id,
        name: membership.company.name,
        hideExpenses: membership.company.hideExpenses,
      },
      role: membership.role,
      permissions,
    });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
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
    // tokenVersion++ 로 모든 기존 세션 무효화. 본인은 응답으로 받은 새 토큰으로 자동 갱신.
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
      select: { id: true, tokenVersion: true, isSuperAdmin: true },
    });

    // 본인 새 토큰 발급 — 현재 회사 컨텍스트 유지
    const token = jwt.sign(
      {
        sub: updated.id,
        companyId: req.user.companyId,
        role: req.user.role,
        isSuperAdmin: updated.isSuperAdmin,
        tv: updated.tokenVersion,
      },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    audit(req, 'auth.password-change', { targetType: 'USER', targetId: updated.id });

    res.json({ ok: true, token });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

module.exports = router;
