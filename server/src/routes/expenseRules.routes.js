const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

// 회사 설정으로 지출관리 비활성화된 경우 차단
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

// GET /api/expense-rules
router.get('/', async (req, res, next) => {
  try {
    const where = { companyId: req.user.companyId };
    if (req.query.activeOnly !== 'false') where.active = true;
    const rules = await prisma.expenseCategoryRule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { keyword: 'asc' }],
      include: { accountCode: true },
    });
    res.json({ rules });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  keyword: z.string().min(1),
  accountCodeId: z.string().optional().nullable(),
  siteCode: z.string().optional().nullable(),
  workCategory: z.string().optional().nullable(),
  priority: z.number().int().optional(),
  active: z.boolean().optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const rule = await prisma.expenseCategoryRule.create({
      data: {
        companyId: req.user.companyId,
        keyword: data.keyword.trim(),
        accountCodeId: data.accountCodeId || null,
        siteCode: data.siteCode?.trim() || null,
        workCategory: data.workCategory?.trim() || null,
        priority: data.priority ?? 0,
        active: data.active ?? true,
        createdById: req.user.id,
      },
    });
    res.status(201).json({ rule });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

const updateSchema = createSchema.partial();
router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.expenseCategoryRule.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updateData = {};
    if (data.keyword !== undefined) updateData.keyword = data.keyword.trim();
    if (data.accountCodeId !== undefined) updateData.accountCodeId = data.accountCodeId || null;
    if (data.siteCode !== undefined) updateData.siteCode = data.siteCode?.trim() || null;
    if (data.workCategory !== undefined) updateData.workCategory = data.workCategory?.trim() || null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.active !== undefined) updateData.active = data.active;
    const rule = await prisma.expenseCategoryRule.update({ where: { id: req.params.id }, data: updateData });
    res.json({ rule });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.expenseCategoryRule.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.expenseCategoryRule.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/expense-rules/classify  — 텍스트 분류 시뮬레이션 (CSV 가져오기 미리보기용)
router.post('/classify', async (req, res, next) => {
  try {
    const { texts } = req.body || {};
    if (!Array.isArray(texts)) return res.status(400).json({ error: 'texts 배열 필요' });
    const { classifyMany } = require('../services/autoClassify');
    const results = await classifyMany(req.user.companyId, texts);
    res.json({ results });
  } catch (e) { next(e); }
});

module.exports = router;
