const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired, requireRole } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/vendors  — 검색/공종 필터
router.get('/', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const where = { companyId: req.user.companyId };
    if (category) where.category = category;
    if (q) {
      where.OR = [
        { name:    { contains: q, mode: 'insensitive' } },
        { contact: { contains: q, mode: 'insensitive' } },
        { phone:   { contains: q } },
        { memo:    { contains: q, mode: 'insensitive' } },
      ];
    }
    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json({ vendors });
  } catch (e) { next(e); }
});

// GET /api/vendors/categories  — 회사에서 사용 중인 공종 목록 (autocomplete용)
router.get('/categories', async (req, res, next) => {
  try {
    const rows = await prisma.vendor.findMany({
      where: { companyId: req.user.companyId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    res.json({ categories: rows.map((r) => r.category).filter(Boolean) });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  name:        z.string().min(1),
  category:    z.string().min(1),
  contact:     z.string().optional().nullable(),
  phone:       z.string().optional().nullable(),
  unitPrice:   z.number().nonnegative().optional().nullable(),
  unit:        z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  memo:        z.string().optional().nullable(),
});

router.post('/', requireRole('OWNER', 'DESIGNER'), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const vendor = await prisma.vendor.create({
      data: {
        companyId:   req.user.companyId,
        name:        data.name.trim(),
        category:    data.category.trim(),
        contact:     data.contact?.trim() || null,
        phone:       data.phone?.trim() || null,
        unitPrice:   data.unitPrice ?? null,
        unit:        data.unit?.trim() || null,
        bankAccount: data.bankAccount?.trim() || null,
        memo:        data.memo?.trim() || null,
      },
    });
    res.status(201).json({ vendor });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const updateSchema = createSchema.partial();

router.patch('/:id', requireRole('OWNER', 'DESIGNER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body || {});

    const existing = await prisma.vendor.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: '협력업체를 찾을 수 없습니다' });

    const updateData = {};
    if (data.name        !== undefined) updateData.name        = data.name.trim();
    if (data.category    !== undefined) updateData.category    = data.category.trim();
    if (data.contact     !== undefined) updateData.contact     = data.contact?.trim() || null;
    if (data.phone       !== undefined) updateData.phone       = data.phone?.trim() || null;
    if (data.unitPrice   !== undefined) updateData.unitPrice   = data.unitPrice ?? null;
    if (data.unit        !== undefined) updateData.unit        = data.unit?.trim() || null;
    if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount?.trim() || null;
    if (data.memo        !== undefined) updateData.memo        = data.memo?.trim() || null;

    const vendor = await prisma.vendor.update({ where: { id }, data: updateData });
    res.json({ vendor });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

router.delete('/:id', requireRole('OWNER'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.vendor.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: '협력업체를 찾을 수 없습니다' });

    await prisma.vendor.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
