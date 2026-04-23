const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
const globalRouter = express.Router();
router.use(authRequired);
globalRouter.use(authRequired);

async function attachPhotos(items) {
  if (items.length === 0) return items;
  const ids = items.map((i) => i.id);
  const photos = await prisma.projectPhoto.findMany({
    where: { source: 'CHECKLIST', sourceId: { in: ids } },
    select: { id: true, sourceId: true, url: true, thumbnailUrl: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  const grouped = {};
  for (const p of photos) {
    (grouped[p.sourceId] ||= []).push(p);
  }
  return items.map((i) => ({ ...i, photos: grouped[i.id] || [] }));
}

// GET /api/checklists    (회사 전체, 프로젝트 이름 포함)
globalRouter.get('/', async (req, res, next) => {
  try {
    const items = await prisma.projectChecklist.findMany({
      where: { project: { companyId: req.user.companyId } },
      include: {
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        completedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ isDone: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ items: await attachPhotos(items) });
  } catch (e) {
    next(e);
  }
});

const CATEGORIES = ['GENERAL', 'CLIENT_REQUEST', 'DESIGN_TO_FIELD', 'TOUCH_UP', 'URGENT'];

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

const includeUsers = {
  createdBy: { select: { id: true, name: true } },
  completedBy: { select: { id: true, name: true } },
};

// GET /api/projects/:projectId/checklists
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const items = await prisma.projectChecklist.findMany({
      where: { projectId },
      orderBy: [{ isDone: 'asc' }, { orderIndex: 'asc' }, { createdAt: 'asc' }],
      include: includeUsers,
    });
    res.json({ items: await attachPhotos(items) });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  title: z.string().min(1),
  category: z.enum(CATEGORIES).optional(),
  phase: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  requiresPhoto: z.boolean().optional(),
});

// POST /api/projects/:projectId/checklists
router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = createSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const item = await prisma.projectChecklist.create({
      data: {
        projectId,
        title: data.title.trim(),
        category: data.category || 'GENERAL',
        phase: data.phase || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        requiresPhoto: data.requiresPhoto || false,
        createdById: req.user.id,
      },
      include: includeUsers,
    });
    res.status(201).json({ item: { ...item, photos: [] } });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  category: z.enum(CATEGORIES).optional(),
  phase: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  requiresPhoto: z.boolean().optional(),
});

// PATCH /api/projects/:projectId/checklists/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const data = updateSchema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.projectChecklist.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const item = await prisma.projectChecklist.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.phase !== undefined && { phase: data.phase || null }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
        ...(data.requiresPhoto !== undefined && { requiresPhoto: data.requiresPhoto }),
      },
      include: includeUsers,
    });
    res.json({ item });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// DELETE /api/projects/:projectId/checklists/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.projectChecklist.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    await prisma.$transaction([
      prisma.projectPhoto.deleteMany({ where: { source: 'CHECKLIST', sourceId: id } }),
      prisma.projectChecklist.delete({ where: { id } }),
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// POST /api/projects/:projectId/checklists/:id/toggle
router.post('/:id/toggle', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.projectChecklist.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const newDone = !existing.isDone;

    if (newDone && existing.requiresPhoto) {
      const photoCount = await prisma.projectPhoto.count({
        where: { source: 'CHECKLIST', sourceId: id },
      });
      if (photoCount === 0) {
        return res.status(400).json({
          error: '사진 첨부가 필요한 항목입니다. 사진을 1장 이상 업로드 후 완료 처리하세요.',
        });
      }
    }

    const item = await prisma.projectChecklist.update({
      where: { id },
      data: {
        isDone: newDone,
        completedAt: newDone ? new Date() : null,
        completedById: newDone ? req.user.id : null,
      },
      include: includeUsers,
    });
    const enriched = (await attachPhotos([item]))[0];
    res.json({ item: enriched });
  } catch (e) {
    next(e);
  }
});

module.exports = { router, globalRouter };
