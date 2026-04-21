const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/account-codes
router.get('/', async (req, res, next) => {
  try {
    const where = { companyId: req.user.companyId };
    if (req.query.activeOnly !== 'false') where.active = true;
    const codes = await prisma.accountCode.findMany({
      where,
      orderBy: [{ groupName: 'asc' }, { orderIndex: 'asc' }, { code: 'asc' }],
    });
    res.json({ codes });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  code: z.string().min(1),
  groupName: z.string().optional().nullable(),
  active: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const code = await prisma.accountCode.create({
      data: {
        companyId: req.user.companyId,
        code: data.code.trim(),
        groupName: data.groupName?.trim() || null,
        active: data.active ?? true,
        orderIndex: data.orderIndex ?? 0,
        createdById: req.user.id,
      },
    });
    res.status(201).json({ code });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    if (e.code === 'P2002') return res.status(409).json({ error: '이미 존재하는 계정과목 코드입니다' });
    next(e);
  }
});

const updateSchema = createSchema.partial();
router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const existing = await prisma.accountCode.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const updateData = {};
    if (data.code !== undefined) updateData.code = data.code.trim();
    if (data.groupName !== undefined) updateData.groupName = data.groupName?.trim() || null;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;
    const code = await prisma.accountCode.update({ where: { id: req.params.id }, data: updateData });
    res.json({ code });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.accountCode.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.accountCode.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
