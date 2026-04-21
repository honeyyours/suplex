const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { classifyOne } = require('../services/autoClassify');

const router = express.Router();
router.use(authRequired);

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
    const { projectId, dateFrom, dateTo, accountCodeId, accountGroup, type, vendor, q } = req.query;
    const where = { companyId: req.user.companyId };

    if (projectId === 'NONE') where.projectId = null;
    else if (projectId) where.projectId = projectId;

    if (accountCodeId === 'NONE') where.accountCodeId = null;
    else if (accountCodeId) where.accountCodeId = accountCodeId;

    if (accountGroup) where.accountCode = { groupName: accountGroup };

    if (type && TYPES.includes(type)) where.type = type;
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

    // 지출만 집계 (TRANSFER 제외, INCOME 별도)
    const expenseWhere = { companyId, type: 'EXPENSE' };
    const incomeWhere = { companyId, type: 'INCOME' };

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
      prisma.$queryRaw`
        SELECT ac."groupName" AS group_name, SUM(e.amount)::float AS total, COUNT(*)::int AS count
        FROM "expenses" e
        LEFT JOIN "account_codes" ac ON e."accountCodeId" = ac.id
        WHERE e."companyId" = ${companyId} AND e."type" = 'EXPENSE'
        GROUP BY ac."groupName"
        ORDER BY total DESC
      `,
    ]);

    // 프로젝트 PnL
    const projects = await prisma.project.findMany({
      where: { companyId },
      select: { id: true, name: true, status: true, contractAmount: true, siteCode: true },
      orderBy: { createdAt: 'desc' },
    });
    const expByProject = new Map(byProject.map((g) => [g.projectId, Number(g._sum.amount || 0)]));
    const pnl = projects.map((p) => {
      const totalExpense = expByProject.get(p.id) || 0;
      const contract = Number(p.contractAmount || 0);
      const profit = contract - totalExpense;
      const margin = contract > 0 ? (profit / contract) * 100 : null;
      return { ...p, contractAmount: contract, totalExpense, profit, margin };
    });

    const noProjectAgg = await prisma.expense.aggregate({
      where: { ...expenseWhere, projectId: null },
      _sum: { amount: true }, _count: true,
    });

    res.json({
      thisMonth: { total: Number(thisExp._sum.amount || 0), count: thisExp._count },
      prevMonth: { total: Number(prevExp._sum.amount || 0), count: prevExp._count },
      allTime:   { total: Number(allExp._sum.amount || 0),   count: allExp._count },
      thisMonthIncome: { total: Number(thisInc._sum.amount || 0), count: thisInc._count },
      allTimeIncome:   { total: Number(allInc._sum.amount || 0),   count: allInc._count },
      noProject: { total: Number(noProjectAgg._sum.amount || 0), count: noProjectAgg._count },
      byGroup,
      pnl,
    });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  projectId: z.string().optional().nullable(),
  date: z.string().min(1),
  amount: z.number(),
  type: z.enum(TYPES).optional(),
  vendor: z.string().optional().nullable(),
  accountCodeId: z.string().optional().nullable(),
  workCategory: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  purchaseOrderId: z.string().optional().nullable(),
  importedFrom: z.string().optional().nullable(),
  rawText: z.string().optional().nullable(),
});

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

    const expense = await prisma.expense.create({
      data: {
        companyId: req.user.companyId,
        projectId: projectId || null,
        date: new Date(data.date),
        amount: data.amount,
        type: data.type || 'EXPENSE',
        vendor: data.vendor?.trim() || null,
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

// POST /api/expenses/bulk (CSV 가져오기. items에 이미 분류 포함)
router.post('/bulk', async (req, res, next) => {
  try {
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

    const rows = items.map((it) => ({
      companyId: req.user.companyId,
      projectId: it.projectId && validProjectIds.has(it.projectId) ? it.projectId : null,
      accountCodeId: it.accountCodeId && validAcctIds.has(it.accountCodeId) ? it.accountCodeId : null,
      date: it.date ? new Date(it.date) : new Date(),
      amount: Number(it.amount) || 0,
      type: TYPES.includes(it.type) ? it.type : 'EXPENSE',
      vendor: it.vendor ? String(it.vendor).trim() : null,
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

    const updateData = {};
    if (data.projectId !== undefined) updateData.projectId = data.projectId || null;
    if (data.date !== undefined) updateData.date = new Date(data.date);
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.vendor !== undefined) updateData.vendor = data.vendor?.trim() || null;
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

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.expense.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
