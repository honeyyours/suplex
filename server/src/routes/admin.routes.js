// 슈퍼 어드민 콘솔 — 회사·사용자 메타 관리 (베타 7번)
// 모든 라우트는 isSuperAdmin === true 만 접근. 회사 데이터 직접 조회 X (메타만).
// 자세한 정책: 메모리 `수플렉스_설계_가입권한플로우.md`
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired, requireSuperAdmin } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);
router.use(requireSuperAdmin);

// ============================================
// GET /api/admin/companies — 모든 회사 메타 + OWNER + 멤버 수 + 프로젝트 수
// ============================================
router.get('/companies', async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { memberships: true, projects: true } },
        memberships: {
          where: { role: 'OWNER' },
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    });
    res.json({
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        hideExpenses: c.hideExpenses,
        createdAt: c.createdAt,
        memberCount: c._count.memberships,
        projectCount: c._count.projects,
        owners: c.memberships.map((m) => ({
          userId: m.user.id, email: m.user.email, name: m.user.name,
        })),
      })),
    });
  } catch (e) { next(e); }
});

// ============================================
// GET /api/admin/users — 모든 사용자 + 소속 회사
// ============================================
router.get('/users', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const where = q ? {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ],
    } : {};
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        memberships: {
          include: { company: { select: { id: true, name: true } } },
        },
      },
    });
    res.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        isSuperAdmin: u.isSuperAdmin,
        createdAt: u.createdAt,
        memberships: u.memberships.map((m) => ({
          companyId: m.companyId, companyName: m.company.name, role: m.role,
        })),
      })),
    });
  } catch (e) { next(e); }
});

// ============================================
// DELETE /api/admin/users/:id — 사용자 + OWNER 회사 cascade 삭제
// ============================================
router.delete('/users/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (userId === req.user.id) {
      return res.status(400).json({ error: '본인 계정은 어드민 콘솔에서 삭제할 수 없습니다' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { select: { companyId: true, role: true } } },
    });
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

    const ownedCompanyIds = user.memberships.filter((m) => m.role === 'OWNER').map((m) => m.companyId);

    await prisma.$transaction(async (tx) => {
      // 사용자가 OWNER인 회사들 cascade 삭제 (모든 데이터 함께 삭제)
      if (ownedCompanyIds.length > 0) {
        await tx.company.deleteMany({ where: { id: { in: ownedCompanyIds } } });
      }
      // 사용자 삭제 (남은 Membership cascade)
      await tx.user.delete({ where: { id: userId } });
    });

    res.json({ ok: true, deletedUserId: userId, deletedCompanyIds: ownedCompanyIds });
  } catch (e) { next(e); }
});

// ============================================
// DELETE /api/admin/companies/:id — 회사 cascade 삭제
// ============================================
router.delete('/companies/:id', async (req, res, next) => {
  try {
    const companyId = req.params.id;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ error: '회사를 찾을 수 없습니다' });

    await prisma.company.delete({ where: { id: companyId } });
    res.json({ ok: true, deletedCompanyId: companyId });
  } catch (e) { next(e); }
});

// ============================================
// POST /api/admin/users/:id/reset-password — 임시 비번 강제 리셋
// 응답에 새 임시 비번 포함 (어드민이 사용자에게 카톡 등으로 전달)
// ============================================
router.post('/users/:id/reset-password', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });

    // 영문 + 숫자 12자 (헷갈리는 0/O/I/l 제외)
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let temp = '';
    const bytes = crypto.randomBytes(12);
    for (let i = 0; i < 12; i++) temp += chars[bytes[i] % chars.length];

    const passwordHash = await bcrypt.hash(temp, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ ok: true, email: user.email, tempPassword: temp });
  } catch (e) { next(e); }
});

// ============================================
// PATCH /api/admin/users/:id — isSuperAdmin 토글 등 (베타엔 isSuperAdmin만)
// ============================================
const patchUserSchema = z.object({
  isSuperAdmin: z.boolean().optional(),
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const data = patchUserSchema.parse(req.body);

    if (data.isSuperAdmin === false && userId === req.user.id) {
      // 본인 어드민 권한 회수 시 마지막 어드민이면 차단
      const adminCount = await prisma.user.count({ where: { isSuperAdmin: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: '마지막 슈퍼 어드민은 권한을 회수할 수 없습니다' });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, isSuperAdmin: true },
    });
    res.json({ user: updated });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// ============================================
// GET /api/admin/stats — 시스템 통계
// ============================================
router.get('/stats', async (req, res, next) => {
  try {
    const [companyCount, userCount, projectCount, expenseCount] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.expense.count(),
    ]);

    // 최근 30일 가입 추이
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const [recentUsers, recentCompanies] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.company.count({ where: { createdAt: { gte: since } } }),
    ]);

    res.json({
      total: { companies: companyCount, users: userCount, projects: projectCount, expenses: expenseCount },
      last30Days: { newUsers: recentUsers, newCompanies: recentCompanies },
    });
  } catch (e) { next(e); }
});

module.exports = router;
