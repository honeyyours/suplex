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
const { audit } = require('../services/audit');
const { normalizePhase } = require('../services/phases');
const { seedDemoProject } = require('../services/seedDemoProject');

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
        approvalStatus: c.approvalStatus,
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
// GET /api/admin/users — 모든 사용자 + 소속 회사 + 마지막 접속 + 30일 활동량
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

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // 사용자별 30일 활동량 (생성한 프로젝트·일정·보고 + 완료 체크리스트)
    const enriched = await Promise.all(users.map(async (u) => {
      const [projectCount, scheduleCount, reportCount, checklistDoneCount] = await Promise.all([
        prisma.project.count({ where: { createdById: u.id, createdAt: { gte: monthAgo } } }),
        prisma.dailyScheduleEntry.count({ where: { createdById: u.id, createdAt: { gte: monthAgo } } }),
        prisma.dailyReport.count({ where: { authorId: u.id, createdAt: { gte: monthAgo } } }),
        prisma.projectChecklist.count({ where: { completedById: u.id, completedAt: { gte: monthAgo } } }),
      ]);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        isSuperAdmin: u.isSuperAdmin,
        createdAt: u.createdAt,
        lastSeenAt: u.lastSeenAt,
        activity30d: {
          projects: projectCount,
          schedules: scheduleCount,
          reports: reportCount,
          checklistsDone: checklistDoneCount,
          total: projectCount + scheduleCount + reportCount + checklistDoneCount,
        },
        memberships: u.memberships.map((m) => ({
          companyId: m.companyId, companyName: m.company.name, role: m.role,
        })),
      };
    }));

    res.json({ users: enriched });
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
      if (ownedCompanyIds.length > 0) {
        await tx.company.deleteMany({ where: { id: { in: ownedCompanyIds } } });
      }
      await tx.user.delete({ where: { id: userId } });
    });

    audit(req, 'admin.user-delete', {
      targetType: 'USER', targetId: userId,
      metadata: { email: user.email, deletedCompanyIds, ownedCount: ownedCompanyIds.length },
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
    audit(req, 'admin.company-delete', {
      targetType: 'COMPANY', targetId: companyId,
      metadata: { companyName: company.name },
    });
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
    // tokenVersion++ 로 그 사용자 모든 세션 강제 로그아웃 (임시비번으로 새로 로그인해야 함)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });

    audit(req, 'admin.password-reset', { targetType: 'USER', targetId: user.id, metadata: { email: user.email } });

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

    // isSuperAdmin 토글은 보안상 모든 세션 무효화 권장
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { ...data, ...(data.isSuperAdmin !== undefined ? { tokenVersion: { increment: 1 } } : {}) },
      select: { id: true, email: true, name: true, isSuperAdmin: true },
    });

    audit(req, 'admin.user-update', { targetType: 'USER', targetId: userId, metadata: data });

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
    const [companyCount, userCount, projectCount, scheduleCount] = await Promise.all([
      prisma.company.count(),
      prisma.user.count(),
      prisma.project.count(),
      prisma.dailyScheduleEntry.count(),
    ]);

    const since = new Date();
    since.setDate(since.getDate() - 30);
    since.setHours(0, 0, 0, 0);

    const [
      recentUsers, recentCompanies, recentProjects, recentSchedules,
      allRecentUsers, allRecentCompanies, allRecentProjects, allRecentSchedules,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: since } } }),
      prisma.company.count({ where: { createdAt: { gte: since } } }),
      prisma.project.count({ where: { createdAt: { gte: since } } }),
      prisma.dailyScheduleEntry.count({ where: { createdAt: { gte: since } } }),
      prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.company.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.project.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.dailyScheduleEntry.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    ]);

    // 일별 카운트 (지난 30일) — 4개 시리즈
    const dailyMap = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const k = d.toISOString().slice(0, 10);
      dailyMap[k] = { date: k, users: 0, companies: 0, projects: 0, schedules: 0 };
    }
    function bump(items, key) {
      for (const it of items) {
        const k = new Date(it.createdAt).toISOString().slice(0, 10);
        if (dailyMap[k]) dailyMap[k][key]++;
      }
    }
    bump(allRecentUsers, 'users');
    bump(allRecentCompanies, 'companies');
    bump(allRecentProjects, 'projects');
    bump(allRecentSchedules, 'schedules');
    const daily = Object.values(dailyMap);

    res.json({
      total: {
        companies: companyCount,
        users: userCount,
        projects: projectCount,
        schedules: scheduleCount,
      },
      last30Days: {
        newUsers: recentUsers,
        newCompanies: recentCompanies,
        newProjects: recentProjects,
        newSchedules: recentSchedules,
        daily,
      },
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

    audit(req, 'admin.transfer-ownership', {
      companyId, targetType: 'USER', targetId: data.userId,
      metadata: { email: targetMembership.user.email },
    });

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
      select: { id: true, email: true, name: true, tokenVersion: true },
    });

    const token = jwt.sign(
      {
        sub: me.id,
        companyId,
        role: 'OWNER',
        impersonating: true,
        originalAdminId: me.id,
        tv: me.tokenVersion || 0,
      },
      env.jwt.secret,
      { expiresIn: '1h' }
    );

    audit(req, 'admin.impersonate-start', {
      companyId, targetType: 'COMPANY', targetId: companyId,
      metadata: { companyName: company.name },
    });

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
// POST /api/admin/companies/:id/seed-demo-project — 시연용 데모 프로젝트 생성
// 같은 회사에 기존 데모(siteCode=DEMO_PROJECT)가 있으면 삭제 후 재생성 (idempotent).
// 풍성한 4축(견적·마감재·일정·발주) 데이터로 공정 현황·공정 상세 시연 가능.
// ============================================
router.post('/companies/:id/seed-demo-project', async (req, res, next) => {
  try {
    const companyId = req.params.id;
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { memberships: { where: { role: 'OWNER' }, take: 1 } },
    });
    if (!company) return res.status(404).json({ error: '회사를 찾을 수 없습니다' });
    const owner = company.memberships[0];
    if (!owner) return res.status(400).json({ error: '회사에 OWNER가 없습니다 — 데모 프로젝트의 createdBy로 사용할 사용자가 필요합니다' });

    const result = await seedDemoProject(prisma, {
      companyId,
      ownerUserId: owner.userId,
    });

    audit(req, 'admin.seed-demo-project', {
      targetType: 'COMPANY',
      targetId: companyId,
      metadata: {
        companyName: company.name,
        projectId: result.projectId,
        counts: result.counts,
      },
    });

    res.json({ ok: true, ...result });
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
    audit(req, 'admin.cleanup-invitations', { metadata: { deletedCount: r.count } });
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

// ============================================
// GET /api/admin/audit-logs — 감사 로그 조회
// query: action / actorId / companyId / take(default 200)
// ============================================
router.get('/audit-logs', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.action) where.action = String(req.query.action);
    if (req.query.actorId) where.actorId = String(req.query.actorId);
    if (req.query.companyId) where.companyId = String(req.query.companyId);
    const take = Math.min(500, Math.max(10, Number(req.query.take) || 200));

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });

    // actor 정보 lookup (배치)
    const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean))];
    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, email: true, name: true },
    });
    const actorMap = new Map(actors.map((u) => [u.id, u]));

    const companyIds = [...new Set(logs.map((l) => l.companyId).filter(Boolean))];
    const companies = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true },
    });
    const companyMap = new Map(companies.map((c) => [c.id, c]));

    res.json({
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        actorType: l.actorType,
        actor: actorMap.get(l.actorId) || { id: l.actorId, email: '(삭제됨)', name: '—' },
        company: l.companyId ? (companyMap.get(l.companyId) || { id: l.companyId, name: '(삭제됨)' }) : null,
        targetType: l.targetType,
        targetId: l.targetId,
        metadata: l.metadata,
        ip: l.ip,
        createdAt: l.createdAt,
      })),
    });
  } catch (e) { next(e); }
});

// ============================================
// POST /api/admin/normalize-phases — 기존 자유 텍스트 phase 데이터 일괄 정규화
// 대상: PhaseKeywordRule, PhaseDeadlineRule, PhaseAdvice (.phase),
//       Material(FINISH).spaceGroup, SimpleQuoteLine(isGroup=true).itemName
// 결과: 변환 카운트 보고 (전후 값 + 영향 행 수)
// dryRun=true면 변경 없이 미리보기만
// ============================================
const normalizeSchema = z.object({ dryRun: z.boolean().optional() });

router.post('/normalize-phases', async (req, res, next) => {
  try {
    const data = normalizeSchema.parse(req.body || {});
    const dryRun = !!data.dryRun;

    const report = {
      phaseKeywordRule:    { changes: {}, totalChecked: 0, totalChanged: 0 },
      phaseDeadlineRule:   { changes: {}, totalChecked: 0, totalChanged: 0 },
      phaseAdvice:         { changes: {}, totalChecked: 0, totalChanged: 0 },
      materialSpaceGroup:  { changes: {}, totalChecked: 0, totalChanged: 0 },
      simpleQuoteGroup:    { changes: {}, totalChecked: 0, totalChanged: 0 },
    };

    function bump(area, before, after) {
      const k = `${before} → ${after}`;
      report[area].changes[k] = (report[area].changes[k] || 0) + 1;
      report[area].totalChanged++;
    }

    // 단순 update만 — unique 제약 없는 영역
    async function normalizeArea(area, modelName, where, getRaw, applyUpdate) {
      const rows = await prisma[modelName].findMany({ where });
      report[area].totalChecked = rows.length;
      for (const row of rows) {
        const raw = getRaw(row);
        if (!raw) continue;
        const newVal = normalizePhase(raw).label;
        if (newVal === raw) continue;
        bump(area, raw, newVal);
        if (!dryRun) await applyUpdate(row, newVal);
      }
    }

    // (companyId, phase) unique 영역 — 충돌 시 중복 row 삭제 (기존 표준 우선)
    async function normalizeAreaWithUnique(area, modelName, where, getRaw, getCompanyId, applyUpdate, applyDelete) {
      const rows = await prisma[modelName].findMany({ where });
      report[area].totalChecked = rows.length;
      for (const row of rows) {
        const raw = getRaw(row);
        if (!raw) continue;
        const newVal = normalizePhase(raw).label;
        if (newVal === raw) continue;

        const conflict = await prisma[modelName].findFirst({
          where: {
            companyId: getCompanyId(row),
            phase: newVal,
            id: { not: row.id },
          },
        });
        if (conflict) {
          // 충돌 — 비표준 row 삭제 (기존 표준이 있으니 그것 유지)
          bump(area, raw, `(중복 → 삭제: ${newVal} 이미 있음)`);
          if (!dryRun) await applyDelete(row);
          continue;
        }
        bump(area, raw, newVal);
        if (!dryRun) await applyUpdate(row, newVal);
      }
    }

    // PhaseKeywordRule — (companyId, keyword) unique. phase는 자유, 단순 update.
    await normalizeArea(
      'phaseKeywordRule', 'phaseKeywordRule', {},
      (r) => r.phase,
      (r, v) => prisma.phaseKeywordRule.update({ where: { id: r.id }, data: { phase: v } })
    );

    // PhaseDeadlineRule — (companyId, phase) UNIQUE. 충돌 처리 필요.
    await normalizeAreaWithUnique(
      'phaseDeadlineRule', 'phaseDeadlineRule', {},
      (r) => r.phase,
      (r) => r.companyId,
      (r, v) => prisma.phaseDeadlineRule.update({ where: { id: r.id }, data: { phase: v } }),
      (r) => prisma.phaseDeadlineRule.delete({ where: { id: r.id } })
    );

    // PhaseAdvice — (companyId, phase) index만 (unique X). 단순 update.
    await normalizeArea(
      'phaseAdvice', 'phaseAdvice', {},
      (r) => r.phase,
      (r, v) => prisma.phaseAdvice.update({ where: { id: r.id }, data: { phase: v } })
    );

    // 마감재 — FINISH만 (APPLIANCE는 spaceGroup이 공간명이라 정규화 X). unique 없음.
    await normalizeArea(
      'materialSpaceGroup', 'material', { kind: 'FINISH' },
      (r) => r.spaceGroup,
      (r, v) => prisma.material.update({ where: { id: r.id }, data: { spaceGroup: v } })
    );

    // 간편 견적 그룹 헤더만 (isGroup=true). 평면 라인은 자재명이라 정규화 X. unique 없음.
    await normalizeArea(
      'simpleQuoteGroup', 'simpleQuoteLine', { isGroup: true },
      (r) => r.itemName,
      (r, v) => prisma.simpleQuoteLine.update({ where: { id: r.id }, data: { itemName: v } })
    );

    audit(req, 'admin.normalize-phases', { metadata: { dryRun, report } });

    res.json({ ok: true, dryRun, report });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// ============================================
// POST /api/admin/companies/:id/preset-default — 시스템 프리셋 표준 회사 지정/해제
// body: { default: true | false }
// 동작: default=true 면 해당 회사를 표준으로 + 다른 모든 회사 false 일괄 처리.
//      default=false 면 해당 회사만 해제 (다른 회사 영향 X).
// 기존 가입 회사 데이터엔 영향 없음 (snapshot 정책). 다음 가입자부터 새 표준 적용.
// ============================================
const presetDefaultSchema = z.object({ default: z.boolean() });

router.post('/companies/:id/preset-default', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = presetDefaultSchema.parse(req.body);
    const company = await prisma.company.findUnique({ where: { id }, select: { id: true, name: true } });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    if (data.default) {
      await prisma.$transaction([
        prisma.company.updateMany({
          where: { isPhasePresetDefault: true, id: { not: id } },
          data: { isPhasePresetDefault: false },
        }),
        prisma.company.update({
          where: { id },
          data: { isPhasePresetDefault: true },
        }),
      ]);
    } else {
      await prisma.company.update({
        where: { id },
        data: { isPhasePresetDefault: false },
      });
    }

    audit(req, 'admin.preset-default', {
      targetType: 'COMPANY',
      targetId: id,
      metadata: { default: data.default, companyName: company.name },
    });

    res.json({ ok: true, id, default: data.default });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// ============================================
// 베타 진입 통제 — 회사 승인/거절
// ============================================

// GET /api/admin/companies/pending — 승인 대기 회사 목록 (PENDING + REJECTED 같이 노출)
router.get('/companies/pending', async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      where: { approvalStatus: { in: ['PENDING', 'REJECTED'] } },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { memberships: true } },
        memberships: {
          where: { role: 'OWNER' },
          include: { user: { select: { id: true, email: true, name: true, phone: true, createdAt: true } } },
        },
      },
    });
    res.json({
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        approvalStatus: c.approvalStatus,
        createdAt: c.createdAt,
        memberCount: c._count.memberships,
        owners: c.memberships.map((m) => ({
          userId: m.user.id,
          email: m.user.email,
          name: m.user.name,
          phone: m.user.phone,
          joinedAt: m.user.createdAt,
        })),
      })),
    });
  } catch (e) { next(e); }
});

// POST /api/admin/companies/:id/approve — 회사 승인
router.post('/companies/:id/approve', async (req, res, next) => {
  try {
    const id = req.params.id;
    const company = await prisma.company.findUnique({ where: { id }, select: { id: true, name: true, approvalStatus: true } });
    if (!company) return res.status(404).json({ error: '회사를 찾을 수 없습니다' });
    if (company.approvalStatus === 'APPROVED') {
      return res.json({ ok: true, alreadyApproved: true });
    }
    await prisma.company.update({ where: { id }, data: { approvalStatus: 'APPROVED' } });
    audit(req, 'company.approve', {
      targetType: 'COMPANY', targetId: id,
      metadata: { name: company.name, prevStatus: company.approvalStatus },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/admin/companies/:id/reject — 회사 거절 (사용자에게는 PENDING과 동일하게 표시)
router.post('/companies/:id/reject', async (req, res, next) => {
  try {
    const id = req.params.id;
    const company = await prisma.company.findUnique({ where: { id }, select: { id: true, name: true, approvalStatus: true } });
    if (!company) return res.status(404).json({ error: '회사를 찾을 수 없습니다' });
    await prisma.company.update({ where: { id }, data: { approvalStatus: 'REJECTED' } });
    audit(req, 'company.reject', {
      targetType: 'COMPANY', targetId: id,
      metadata: { name: company.name, prevStatus: company.approvalStatus },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
