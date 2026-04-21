const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { buildSeedRows } = require('../services/materialTemplateSeed');

const router = express.Router();
router.use(authRequired);

// GET /api/material-templates?kind=FINISH
router.get('/', async (req, res, next) => {
  try {
    const where = { companyId: req.user.companyId, active: true };
    if (req.query.kind) where.kind = req.query.kind;
    const templates = await prisma.materialTemplate.findMany({
      where,
      orderBy: [{ kind: 'asc' }, { orderIndex: 'asc' }],
    });
    res.json({ templates });
  } catch (e) {
    next(e);
  }
});

// POST /api/material-templates/seed   — 비어있으면 PDF 기반 기본 템플릿 시드
router.post('/seed', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const existing = await prisma.materialTemplate.count({ where: { companyId } });
    if (existing > 0 && !req.body?.force) {
      return res.status(409).json({
        error: '이미 템플릿이 존재합니다. force:true 로 덮어쓸 수 있습니다',
        existing,
      });
    }

    if (req.body?.force && existing > 0) {
      await prisma.materialTemplate.deleteMany({ where: { companyId } });
    }

    const rows = buildSeedRows().map((r) => ({ ...r, companyId }));
    const result = await prisma.materialTemplate.createMany({ data: rows });
    res.status(201).json({ ok: true, created: result.count });
  } catch (e) {
    next(e);
  }
});

const upsertSchema = z.object({
  kind: z.enum(['FINISH', 'APPLIANCE']).optional(),
  spaceGroup: z.string().min(1),
  itemName: z.string().min(1),
  defaultSiteNotes: z.string().optional().nullable(),
  orderIndex: z.number().int().optional(),
  active: z.boolean().optional(),
});

// POST /api/material-templates
router.post('/', async (req, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    const template = await prisma.materialTemplate.create({
      data: {
        companyId: req.user.companyId,
        kind: data.kind || 'FINISH',
        spaceGroup: data.spaceGroup.trim(),
        itemName: data.itemName.trim(),
        defaultSiteNotes: data.defaultSiteNotes?.trim() || null,
        orderIndex: data.orderIndex ?? 0,
        active: data.active ?? true,
      },
    });
    res.status(201).json({ template });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// PATCH /api/material-templates/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.materialTemplate.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const data = upsertSchema.partial().parse(req.body);
    const template = await prisma.materialTemplate.update({
      where: { id },
      data: {
        ...(data.kind !== undefined && { kind: data.kind }),
        ...(data.spaceGroup !== undefined && { spaceGroup: data.spaceGroup.trim() }),
        ...(data.itemName !== undefined && { itemName: data.itemName.trim() }),
        ...(data.defaultSiteNotes !== undefined && { defaultSiteNotes: data.defaultSiteNotes?.trim() || null }),
        ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
    res.json({ template });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// DELETE /api/material-templates/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.materialTemplate.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.materialTemplate.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
