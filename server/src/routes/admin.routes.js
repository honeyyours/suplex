// 슈퍼 어드민 콘솔 — 회사·사용자 메타 관리 (베타 7번)
// 모든 라우트는 isSuperAdmin === true 만 접근. 회사 데이터 직접 조회 X (메타만).
// 자세한 정책: 메모리 `수플렉스_설계_가입권한플로우.md`
const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { authRequired, requireSuperAdmin } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);
router.use(requireSuperAdmin);

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DORMANT_DAYS = 7;

// ============================================
// GET /api/admin/companies — 모든 회사 메타 + OWNER + 멤버/프로젝트 수 + 활동 정보
// query: q (검색어), sort=name|created|activity, dormantOnly=true
// ============================================
router.get('/companies', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const sort = (req.query.sort || 'created').toString();
    const dormantOnly = req.query.dormantOnly === 'true';

    const where = q ? { name: { contains: q, mode: 'insensitive' } } : {};

    const companies = await prisma.company.findMany({
      where,
      orderBy: sort === 'name' ? { name: 'asc' } : { createdAt: 'desc' },
      include: {
        _count: { select: { memberships: true, projects: true } },
        memberships: {
          where: { role: 'OWNER' },
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    });

    const weekAgo = new Date(Date.now() - WEEK_MS);
    const dormantThreshold = new Date(Date.now() - DORMANT_DAYS * 24 * 60 * 60 * 1000);

    // 회사별 활동 집계 (병렬)
    const enriched = await Promise.all(companies.map(async (c) => {
      const projectScope = { project: { companyId: c.id } };
      const [
        weekScheduleChanges,
        weekReports,
        weekChecklists,
        weekExpenses,
        lastSc,
        lastReport,
        lastExpense,
      ] = await Promise.all([
        prisma.scheduleChange.count({ where: { ...projectScope, createdAt: { gte: weekAgo } } }),
        prisma.dailyReport.count({ where: { ...projectScope, createdAt: { gte: weekAgo } } }),
        prisma.projectChecklist.count({ where: { ...projectScope, completedAt: { gte: weekAgo } } }),
        prisma.expense.count({ where: { companyId: c.id, createdAt: { gte: weekAgo } } }),
        prisma.scheduleChange.findFirst({ where: projectScope, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
        prisma.dailyReport.findFirst({ where: projectScope, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
        prisma.expense.findFirst({ where: { companyId: c.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
      ]);

      const dates = [c.createdAt, lastSc?.createdAt, lastReport?.createdAt, lastExpense?.createdAt].filter(Boolean);
      const lastActivityAt = dates.length > 0 ? new Date(Math.max(...dates.map((d) => +new Date(d)))) : c.createdAt;
      const weekActivityScore = weekScheduleChanges + weekReports + weekChecklists + weekExpenses;
      const isDormant = lastActivityAt < dormantThreshold;

      return {
        id: c.id,
        name: c.name,
        hideExpenses: c.hideExpenses,
        createdAt: c.createdAt,
        memberCount: c._count.memberships,
        projectCount: c._count.projects,
        owners: c.memberships.map((m) => ({
          userId: m.user.id, email: m.user.email, name: m.user.name,
        })),
        lastActivityAt,
        weekActivityScore,
        isDormant,
      };
    }));

    let result = enriched;
    if (dormantOnly) result = result.filter((c) => c.isDormant);
    if (sort === 'activity') {
      result = [...result].sort((a, b) => b.weekActivityScore - a.weekActivityScore);
    }

    res.json({ companies: result });
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
// GET /api/admin/stats — 시스템 통계 + 30일 가입 추세 (일별)
// ============================================
router.get('/stats', async (req, res, next) => {
  try {
    const [companyCount, userCount, projectCount, expenseCount] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.expense.count(),
    ]);

    const since = new Date();
    since.setDate(since.getDate() - 30);
    since.setHours(0, 0, 0, 0);

    const [recentUsers, recentCompanies, allRecentUsers, allRecentCompanies] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.company.count({ where: { createdAt: { gte: since } } }),
      prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.company.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    ]);

    // 일별 카운트 (지난 30일)
    const dailyMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      dailyMap[k] = { date: k, users: 0, companies: 0 };
    }
    for (const u of allRecentUsers) {
      const k = new Date(u.createdAt).toISOString().slice(0, 10);
      if (dailyMap[k]) dailyMap[k].users++;
    }
    for (const c of allRecentCompanies) {
      const k = new Date(c.createdAt).toISOString().slice(0, 10);
      if (dailyMap[k]) dailyMap[k].companies++;
    }
    const daily = Object.values(dailyMap);

    res.json({
      total: { companies: companyCount, users: userCount, projects: projectCount, expenses: expenseCount },
      last30Days: { newUsers: recentUsers, newCompanies: recentCompanies, daily },
    });
  } catch (e) { next(e); }
});

// ============================================
// POST /api/admin/companies/:id/transfer-ownership — 다른 멤버를 OWNER로 강제 승격
// 기존 OWNER가 떠나거나 데드락 상태일 때
// ============================================
const transferSchema = z.object({ userId: z.string().min(1) });

router.post('/companies/:id/transfer-ownership', async (req, res, next) => {
  try {
    const companyId = req.params.id;
    const data = transferSchema.parse(req.body);

    const targetMembership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId: data.userId, companyId } },
      include: { user: { select: { email: true, name: true } } },
    });
    if (!targetMembership) {
      return res.status(404).json({ error: '대상 사용자가 이 회사의 멤버가 아닙니다' });
    }

    if (targetMembership.role !== 'OWNER') {
      await prisma.membership.update({
        where: { id: targetMembership.id },
        data: { role: 'OWNER' },
      });
    }
    res.json({
      ok: true,
      newOwner: { userId: data.userId, email: targetMembership.user.email, name: targetMembership.user.name },
    });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// ============================================
// POST /api/admin/companies/:id/impersonate — 사칭 토큰 발급 (READ-ONLY 강제)
// 어드민이 회사 OWNER 컨텍스트로 짧은 시간 진입 (지원·디버깅용)
// 사칭 토큰은 1시간 만료 + impersonating 플래그로 모든 write 차단
// ============================================
router.post('/companies/:id/impersonate', async (req, res, next) => {
  try {
    const companyId = req.params.id;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, hideExpenses: true },
    });
    if (!company) return res.status(404).json({ error: '회사를 찾을 수 없습니다' });

    const me = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true },
    });

    const token = jwt.sign(
      {
        sub: me.id,
        companyId,
        role: 'OWNER',
        impersonating: true,
        originalAdminId: me.id,
      },
      env.jwt.secret,
      { expiresIn: '1h' } // 짧은 만료
    );

    res.json({
      token,
      user: me,
      company,
      role: 'OWNER',
      impersonating: true,
      impersonatedCompanyName: company.name,
    });
  } catch (e) { next(e); }
});

// ============================================
// POST /api/admin/cleanup-invitations — 만료된 초대 일괄 삭제
// ============================================
router.post('/cleanup-invitations', async (req, res, next) => {
  try {
    const r = await prisma.invitation.deleteMany({
      where: {
        acceptedAt: null,
        expiresAt: { lt: new Date() },
      },
    });
    res.json({ ok: true, deletedCount: r.count });
  } catch (e) { next(e); }
});

// ============================================
// GET /api/admin/companies/:id/backup — 회사 백업 JSON 다운로드 (Phase 4 활용)
// ============================================
router.get('/companies/:id/backup', async (req, res, next) => {
  try {
    const companyId = req.params.id;
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) return res.status(404).json({ error: '회사를 찾을 수 없습니다' });

    // 회사의 모든 데이터 모음 (read-only export)
    const [
      memberships, vendors, projects, materialTemplates, accountCodes, expenseRules,
      phaseKeywords, phaseDeadlines, phaseAdvices, applianceSpecs,
    ] = await Promise.all([
      prisma.membership.findMany({ where: { companyId } }),
      prisma.vendor.findMany({ where: { companyId } }),
      prisma.project.findMany({
        where: { companyId },
        include: {
          materials: true,
          schedules: { include: { tasks: true } },
          dailyScheduleEntries: true,
          checklists: true,
          dailyReports: true,
          expenses: true,
          quotes: { include: { lineItems: true } },
          simpleQuotes: { include: { lines: true } },
          memos: true,
          purchaseOrders: true,
          photos: true,
          measurements: true,
          materialRequests: true,
          scheduleChanges: true,
          notifications: true,
        },
      }),
      prisma.materialTemplate.findMany({ where: { companyId } }),
      prisma.accountCode.findMany({ where: { companyId } }),
      prisma.expenseCategoryRule.findMany({ where: { companyId } }),
      prisma.phaseKeywordRule.findMany({ where: { companyId } }),
      prisma.phaseDeadlineRule.findMany({ where: { companyId } }),
      prisma.phaseAdvice.findMany({ where: { companyId } }),
      prisma.applianceSpec.findMany({ where: { companyId } }),
    ]);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="suplex-admin-backup-${company.name}-${Date.now()}.json"`);
    res.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      exportedByAdmin: req.user.id,
      company,
      memberships, vendors, projects, materialTemplates, accountCodes, expenseRules,
      phaseKeywords, phaseDeadlines, phaseAdvices, applianceSpecs,
    });
  } catch (e) { next(e); }
});

module.exports = router;
