const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { buildSeedRows } = require('../services/checklistTemplateSeed');

const router = express.Router();
router.use(authRequired);

const CATEGORIES = ['GENERAL', 'CLIENT_REQUEST', 'DESIGN_TO_FIELD', 'TOUCH_UP', 'URGENT'];

// GET /api/checklist-templates?phase=철거&active=true
router.get('/', async (req, res, next) => {
  try {
    const where = { companyId: req.user.companyId };
    if (req.query.phase) where.phase = req.query.phase;
    if (req.query.active !== undefined) where.active = req.query.active === 'true';
    const templates = await prisma.checklistTemplate.findMany({
      where,
      orderBy: [{ phase: 'asc' }, { orderIndex: 'asc' }],
    });
    res.json({ templates });
  } catch (e) {
    next(e);
  }
});

// POST /api/checklist-templates/seed   — 비어있으면 기본 템플릿 시드
router.post('/seed', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const existing = await prisma.checklistTemplate.count({ where: { companyId } });
    if (existing > 0 && !req.body?.force) {
      return res.status(409).json({
        error: '이미 템플릿이 존재합니다. force:true 로 덮어쓸 수 있습니다',
        existing,
      });
    }

    if (req.body?.force && existing > 0) {
      await prisma.checklistTemplate.deleteMany({ where: { companyId } });
    }

    const rows = buildSeedRows().map((r) => ({ ...r, companyId }));
    const result = await prisma.checklistTemplate.createMany({ data: rows });
    res.status(201).json({ ok: true, created: result.count });
  } catch (e) {
    next(e);
  }
});

const upsertSchema = z.object({
  title: z.string().min(1),
  category: z.enum(CATEGORIES).optional(),
  phase: z.string().optional().nullable(),
  requiresPhoto: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
  active: z.boolean().optional(),
});

// POST /api/checklist-templates
router.post('/', async (req, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    const template = await prisma.checklistTemplate.create({
      data: {
        companyId: req.user.companyId,
        title: data.title.trim(),
        category: data.category || 'GENERAL',
        phase: data.phase?.trim() || null,
        requiresPhoto: data.requiresPhoto ?? false,
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

// PATCH /api/checklist-templates/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.checklistTemplate.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const data = upsertSchema.partial().parse(req.body);
    const template = await prisma.checklistTemplate.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.phase !== undefined && { phase: data.phase?.trim() || null }),
        ...(data.requiresPhoto !== undefined && { requiresPhoto: data.requiresPhoto }),
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

// DELETE /api/checklist-templates/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.checklistTemplate.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.checklistTemplate.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
