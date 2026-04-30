const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { requireFeature, loadPermissionsMap } = require('../middlewares/requireFeature');
const { F, hasFeature } = require('../services/features');
const { classifyOne } = require('../services/autoClassify');
const { findPurchaseOrderCandidates } = require('../services/exitInference');

// 출구정리 정책: 손익(PnL)은 OWNER만. summary 응답에서 권한 없으면 pnl 빼기.
async function canViewPnl(req) {
  if (req.user.role === 'OWNER') return true;
  let plan = null;
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { plan: true },
    });
    plan = company?.plan || null;
  } catch (e) { plan = null; }
  const permissions = await loadPermissionsMap(req);
  return hasFeature({ role: req.user.role, plan, permissions }, F.EXPENSES_VIEW_PNL);
}

// 오픈 디폴트(2026-04-30): 같은 회사 프로젝트면 직원도 접근. 본사/미분류(projectId=null)만 OWNER 전용.
async function assertProjectAccess(req, res, projectId) {
  if (req.user.role === 'OWNER') return true;
  if (!projectId) {
    res.status(403).json({ error: 'Forbidden — non-project transactions are owner-only' });
    return false;
  }
  const p = await prisma.project.findFirst({
    where: { id: projectId, companyId: req.user.companyId },
    select: { id: true },
  });
  if (!p) {
    res.status(404).json({ error: 'Project not found' });
    return false;
  }
  return true;
}

const router = express.Router();
router.use(authRequired);

// 회사 설정으로 지출관리 비활성화된 경우 차단 (회사 단위 hideExpenses 토글)
router.use(async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user.companyId },
      select: { hideExpenses: true },
    });
    if (company?.hideExpenses) {
      return res.status(403).json({ error: '지출관리 기능이 비활성화되어 있습니다', hideExpenses: true });
    }
    next();
  } catch (e) { next(e); }
});

// 역할 가드: OWNER만 접근 가능 (DESIGNER/FIELD 차단)
router.use(requireFeature(F.EXPENSES_VIEW));

const TYPES = ['EXPENSE', 'INCOME', 'TRANSFER'];
const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'];

function num(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// GET /api/expenses?projectId=&dateFrom=&dateTo=&accountCodeId=&type=&q=
router.get('/', async (req, res, next) => {
  try {
    const { projectId, dateFrom, dateTo, accountCodeId, accountGroup, type, vendor, vendorId, q } = req.query;
    const where = { companyId: req.user.companyId };

    // 오픈 디폴트(2026-04-30): 회사 프로젝트는 직원도 모두 조회. 단, 본사/미분류(projectId=null)는 OWNER만.
    if (projectId === 'NONE') {
      if (req.user.role !== 'OWNER') return res.json({ expenses: [] });
      where.projectId = null;
    } else if (projectId) {
      where.projectId = projectId;
    } else {
      // 전체 조회 — 직원은 본사/미분류 제외
      if (req.user.role !== 'OWNER') where.projectId = { not: null };
    }

    if (accountCodeId === 'NONE') where.accountCodeId = null;
    else if (accountCodeId) where.accountCodeId = accountCodeId;

    if (accountGroup) where.accountCode = { groupName: accountGroup };

    if (type && TYPES.includes(type)) where.type = type;
    if (vendorId === 'NONE') where.vendorId = null;
    else if (vendorId) where.vendorId = vendorId;
    if (vendor) where.vendor = { contains: String(vendor), mode: 'insensitive' };

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo)   where.date.lte = new Date(dateTo);
    }

    if (q) {
      where.OR = [
        { description: { contains: String(q), mode: 'insensitive' } },
        { vendor:      { contains: String(q), mode: 'insensitive' } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      take: Number(req.query.limit) || 1000,
      include: {
        project: { select: { id: true, name: true, siteCode: true } },
        accountCode: { select: { id: true, code: true, groupName: true } },
        vendorEntity: { select: { id: true, name: true, category: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });
    res.json({ expenses });
  } catch (e) { next(e); }
});

// GET /api/expenses/summary
router.get('/summary', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const now = new Date();
    const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
    const startNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // 오픈 디폴트(2026-04-30): 직원도 회사 프로젝트 거래는 모두 합산. 본사/미분류(projectId=null)만 OWNER 전용.
    const projectScope = req.user.role === 'OWNER' ? {} : { projectId: { not: null } };

    // 지출만 집계 (TRANSFER 제외, INCOME 별도)
    const expenseWhere = { companyId, type: 'EXPENSE', ...projectScope };
    const incomeWhere = { companyId, type: 'INCOME', ...projectScope };

    const [thisExp, prevExp, allExp, thisInc, allInc, byProject, byGroup] = await Promise.all([
      prisma.expense.aggregate({
        where: { ...expenseWhere, date: { gte: startThis, lt: startNext } },
        _sum: { amount: true }, _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...expenseWhere, date: { gte: startPrev, lt: startThis } },
        _sum: { amount: true }, _count: true,
      }),
      prisma.expense.aggregate({
        where: expenseWhere, _sum: { amount: true }, _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...incomeWhere, date: { gte: startThis, lt: startNext } },
        _sum: { amount: true }, _count: true,
      }),
      prisma.expense.aggregate({
        where: incomeWhere, _sum: { amount: true }, _count: true,
      }),
      prisma.expense.groupBy({
        by: ['projectId'],
        where: expenseWhere,
        _sum: { amount: true },
      }),
      // byGroup: 직원에게는 멤버 프로젝트 거래의 그룹별 합. 단순화: 직원이면 prisma.expense.groupBy로 계정 그룹 직접 집계.
      accessibleIds !== null
        ? (async () => {
            const grouped = await prisma.expense.groupBy({
              by: ['accountCodeId'],
              where: { companyId, type: 'EXPENSE', projectId: { in: accessibleIds } },
              _sum: { amount: true }, _count: true,
            });
            const codeIds = grouped.map((g) => g.accountCodeId).filter(Boolean);
            const codes = codeIds.length > 0
              ? await prisma.accountCode.findMany({ where: { id: { in: codeIds } }, select: { id: true, groupName: true } })
              : [];
            const groupMap = new Map(codes.map((c) => [c.id, c.groupName]));
            const aggMap = new Map();
            for (const g of grouped) {
              const gName = g.accountCodeId ? (groupMap.get(g.accountCodeId) || null) : null;
              const cur = aggMap.get(gName) || { group_name: gName, total: 0, count: 0 };
              cur.total += Number(g._sum.amount || 0);
              cur.count += g._count;
              aggMap.set(gName, cur);
            }
            return Array.from(aggMap.values()).sort((a, b) => b.total - a.total);
          })()
        : prisma.$queryRaw`
        SELECT ac."groupName" AS group_name, SUM(e.amount)::float AS total, COUNT(*)::int AS count
        FROM "expenses" e
        LEFT JOIN "account_codes" ac ON e."accountCodeId" = ac.id
        WHERE e."companyId" = ${companyId} AND e."type" = 'EXPENSE'
        GROUP BY ac."groupName"
        ORDER BY total DESC
      `,
    ]);

    const allowPnl = await canViewPnl(req);

    // 프로젝트 PnL — OWNER(또는 EXPENSES_VIEW_PNL 토글 ON)만 계산·반환
    let pnl = null;
    if (allowPnl) {
      const projects = await prisma.project.findMany({
        where: { companyId },
        select: { id: true, name: true, status: true, contractAmount: true, siteCode: true },
        orderBy: { createdAt: 'desc' },
      });
      const expByProject = new Map(byProject.map((g) => [g.projectId, Number(g._sum.amount || 0)]));
      pnl = projects.map((p) => {
        const totalExpense = expByProject.get(p.id) || 0;
        const contract = Number(p.contractAmount || 0);
        const profit = contract - totalExpense;
        const margin = contract > 0 ? (profit / contract) * 100 : null;
        return { ...p, contractAmount: contract, totalExpense, profit, margin };
      });
    }

    // 본사/미분류는 OWNER 한정. 직원에게는 0.
    const noProjectAgg = req.user.role === 'OWNER'
      ? await prisma.expense.aggregate({
          where: { companyId, type: 'EXPENSE', projectId: null },
          _sum: { amount: true }, _count: true,
        })
      : { _sum: { amount: 0 }, _count: 0 };

    res.json({
      thisMonth: { total: Number(thisExp._sum.amount || 0), count: thisExp._count },
      prevMonth: { total: Number(prevExp._sum.amount || 0), count: prevExp._count },
      allTime:   { total: Number(allExp._sum.amount || 0),   count: allExp._count },
      thisMonthIncome: { total: Number(thisInc._sum.amount || 0), count: thisInc._count },
      allTimeIncome:   { total: Number(allInc._sum.amount || 0),   count: allInc._count },
      noProject: { total: Number(noProjectAgg._sum.amount || 0), count: noProjectAgg._count },
      byGroup,
      pnl,
      canViewPnl: allowPnl,
    });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  projectId: z.string().optional().nullable(),
  date: z.string().min(1),
  amount: z.number(),
  type: z.enum(TYPES).optional(),
  vendor: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  accountCodeId: z.string().optional().nullable(),
  workCategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  purchaseOrderId: z.string().optional().nullable(),
  importedFrom: z.string().optional().nullable(),
  rawText: z.string().optional().nullable(),
});

async function resolveVendor(companyId, vendorId, vendorText) {
  if (!vendorId) return { vendorId: null, vendor: vendorText?.trim() || null };
  const v = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId },
    select: { id: true, name: true },
  });
  if (!v) return { vendorId: null, vendor: vendorText?.trim() || null };
  return { vendorId: v.id, vendor: vendorText?.trim() || v.name };
}

async function assertProjectIfGiven(projectId, companyId) {
  if (!projectId) return true;
  const p = await prisma.project.findFirst({ where: { id: projectId, companyId } });
  return !!p;
}

// POST /api/expenses (자동분류 적용)
router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    if (data.projectId && !(await assertProjectIfGiven(data.projectId, req.user.companyId))) {
      return res.status(400).json({ error: '존재하지 않는 프로젝트입니다' });
    }
    // 직원은 자기 멤버 프로젝트로만 생성 가능. 본사/null도 OWNER만.
    if (!(await assertProjectAccess(req, res, data.projectId))) return;

    // 자동 분류: accountCodeId 미지정 + description 있으면 룰로 분류 시도
    let { accountCodeId, projectId, workCategory } = data;
    if (!accountCodeId && data.description) {
      const guess = await classifyOne(req.user.companyId, data.description);
      if (guess) {
        if (!accountCodeId && guess.accountCodeId) accountCodeId = guess.accountCodeId;
        if (!workCategory && guess.workCategory) workCategory = guess.workCategory;
        // siteCode → projectId 매핑
        if (!projectId && guess.siteCode) {
          const p = await prisma.project.findFirst({
            where: { companyId: req.user.companyId, siteCode: guess.siteCode },
            select: { id: true },
          });
          if (p) projectId = p.id;
        }
      }
    }

    const vendorResolved = await resolveVendor(req.user.companyId, data.vendorId, data.vendor);

    const expense = await prisma.expense.create({
      data: {
        companyId: req.user.companyId,
        projectId: projectId || null,
        date: new Date(data.date),
        amount: data.amount,
        type: data.type || 'EXPENSE',
        vendor: vendorResolved.vendor,
        vendorId: vendorResolved.vendorId,
        accountCodeId: accountCodeId || null,
        workCategory: workCategory?.trim() || null,
        description: data.description?.trim() || null,
        paymentMethod: data.paymentMethod || null,
        receiptUrl: data.receiptUrl?.trim() || null,
        purchaseOrderId: data.purchaseOrderId || null,
        importedFrom: data.importedFrom?.trim() || '수동',
        rawText: data.rawText?.trim() || null,
        createdById: req.user.id,
      },
    });
    res.status(201).json({ expense });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// POST /api/expenses/bulk (CSV 가져오기. items에 이미 분류 포함). OWNER 한정.
router.post('/bulk', async (req, res, next) => {
  try {
    if (req.user.role !== 'OWNER') {
      return res.status(403).json({ error: 'Forbidden — CSV import is owner only' });
    }
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) return res.status(400).json({ error: 'items 배열 필요' });

    const requestedProjectIds = [...new Set(items.map((i) => i.projectId).filter(Boolean))];
    let validProjectIds = new Set();
    if (requestedProjectIds.length > 0) {
      const found = await prisma.project.findMany({
        where: { id: { in: requestedProjectIds }, companyId: req.user.companyId },
        select: { id: true },
      });
      validProjectIds = new Set(found.map((p) => p.id));
    }

    const requestedAcctIds = [...new Set(items.map((i) => i.accountCodeId).filter(Boolean))];
    let validAcctIds = new Set();
    if (requestedAcctIds.length > 0) {
      const found = await prisma.accountCode.findMany({
        where: { id: { in: requestedAcctIds }, companyId: req.user.companyId },
        select: { id: true },
      });
      validAcctIds = new Set(found.map((a) => a.id));
    }

    const requestedVendorIds = [...new Set(items.map((i) => i.vendorId).filter(Boolean))];
    let vendorMap = new Map();
    if (requestedVendorIds.length > 0) {
      const found = await prisma.vendor.findMany({
        where: { id: { in: requestedVendorIds }, companyId: req.user.companyId },
        select: { id: true, name: true },
      });
      vendorMap = new Map(found.map((v) => [v.id, v.name]));
    }

    const rows = items.map((it) => ({
      companyId: req.user.companyId,
      projectId: it.projectId && validProjectIds.has(it.projectId) ? it.projectId : null,
      accountCodeId: it.accountCodeId && validAcctIds.has(it.accountCodeId) ? it.accountCodeId : null,
      vendorId: it.vendorId && vendorMap.has(it.vendorId) ? it.vendorId : null,
      date: it.date ? new Date(it.date) : new Date(),
      amount: Number(it.amount) || 0,
      type: TYPES.includes(it.type) ? it.type : 'EXPENSE',
      vendor: (it.vendor ? String(it.vendor).trim() : null)
        || (it.vendorId && vendorMap.has(it.vendorId) ? vendorMap.get(it.vendorId) : null),
      workCategory: it.workCategory ? String(it.workCategory).trim() : null,
      description: it.description ? String(it.description).trim() : null,
      paymentMethod: PAYMENT_METHODS.includes(it.paymentMethod) ? it.paymentMethod : null,
      importedFrom: it.importedFrom ? String(it.importedFrom).trim() : 'CSV',
      rawText: it.rawText ? String(it.rawText).trim() : null,
      createdById: req.user.id,
    }));

    const result = await prisma.expense.createMany({ data: rows });
    res.status(201).json({ ok: true, created: result.count });
  } catch (e) { next(e); }
});

const updateSchema = createSchema.partial();
router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (data.projectId && !(await assertProjectIfGiven(data.projectId, req.user.companyId))) {
      return res.status(400).json({ error: '존재하지 않는 프로젝트입니다' });
    }
    // 직원: 거래의 기존 projectId 멤버여야 함. + 변경하려는 projectId도 멤버여야 함.
    if (!(await assertProjectAccess(req, res, existing.projectId))) return;
    if (data.projectId !== undefined && data.projectId !== existing.projectId) {
      if (!(await assertProjectAccess(req, res, data.projectId))) return;
    }

    const updateData = {};
    if (data.projectId !== undefined) updateData.projectId = data.projectId || null;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.vendorId !== undefined || data.vendor !== undefined) {
      const r = await resolveVendor(
        req.user.companyId,
        data.vendorId !== undefined ? data.vendorId : existing.vendorId,
        data.vendor !== undefined ? data.vendor : existing.vendor,
      );
      updateData.vendorId = r.vendorId;
      updateData.vendor = r.vendor;
    }
    if (data.accountCodeId !== undefined) updateData.accountCodeId = data.accountCodeId || null;
    if (data.workCategory !== undefined) updateData.workCategory = data.workCategory?.trim() || null;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod || null;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl?.trim() || null;
    if (data.purchaseOrderId !== undefined) updateData.purchaseOrderId = data.purchaseOrderId || null;

    const expense = await prisma.expense.update({ where: { id: req.params.id }, data: updateData });
    res.json({ expense });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// 출구정리 추론엔진 — 통장 거래 1건에 대한 발주 매칭 후보 점수.
// body: { amount, date, vendorText, projectId? }
// 자동 라벨 X. 사람 1-클릭 컨펌용 후보만 반환.
router.post('/inference-candidates', async (req, res, next) => {
  try {
    const { amount, date, vendorText, projectId } = req.body || {};
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'amount required (positive number)' });
    }
    const candidates = await findPurchaseOrderCandidates(
      { amount: Number(amount), date, vendorText, projectId },
      req.user.companyId,
    );
    res.json({ candidates });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    if (!(await assertProjectAccess(req, res, existing.projectId))) return;
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
