const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { recordChange } = require('../services/scheduleChangeLogger');

const projectRouter = express.Router({ mergeParams: true });
const globalRouter = express.Router();

projectRouter.use(authRequired);
globalRouter.use(authRequired);

async function assertProjectAccess(projectId, companyId) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, companyId },
  });
  return project;
}

async function getUserName(userId) {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return u?.name || '알 수 없음';
}

// ============================================
// GET /api/projects/:projectId/schedules?start=YYYY-MM-DD&end=YYYY-MM-DD
// ============================================
projectRouter.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { start, end } = req.query;

    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = { projectId };
    if (start || end) {
      where.date = {};
      if (start) where.date.gte = new Date(start);
      if (end) where.date.lte = new Date(end);
    }

    const entries = await prisma.dailyScheduleEntry.findMany({
      where,
      orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }],
      include: { vendor: { select: { id: true, name: true, category: true } } },
    });
    res.json({ entries });
  } catch (e) {
    next(e);
  }
});

// ============================================
// GET /api/projects/:projectId/schedules/extract?keyword=...&from=YYYY-MM-DD
// ============================================
projectRouter.get('/extract', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const keyword = (req.query.keyword || '').trim();
    const { from } = req.query;
    if (!keyword) return res.status(400).json({ error: 'keyword 필요' });

    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = {
      projectId,
      OR: [
        { content: { contains: keyword, mode: 'insensitive' } },
        { category: { contains: keyword, mode: 'insensitive' } },
      ],
    };
    if (from) where.date = { gte: new Date(from) };

    const entries = await prisma.dailyScheduleEntry.findMany({
      where,
      orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }],
    });

    res.json({
      keyword,
      entries,
      project: {
        id: project.id,
        name: project.name,
        siteAddress: project.siteAddress,
      },
    });
  } catch (e) {
    next(e);
  }
});

// ============================================
// POST /api/projects/:projectId/schedules
// ============================================
const createSchema = z.object({
  date: z.string(),
  content: z.string().min(1),
  category: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  orderIndex: z.number().int().optional(),
});

async function resolveVendorId(companyId, vendorId) {
  if (!vendorId) return null;
  const v = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId },
    select: { id: true },
  });
  return v ? v.id : null;
}

projectRouter.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = createSchema.parse(req.body);

    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const userName = await getUserName(req.user.id);
    const dateObj = new Date(data.date);

    const entry = await prisma.$transaction(async (tx) => {
      const maxOrder = await tx.dailyScheduleEntry.aggregate({
        where: { projectId, date: dateObj },
        _max: { orderIndex: true },
      });
      const nextOrder = data.orderIndex ?? (maxOrder._max.orderIndex ?? -1) + 1;

      const vendorId = await resolveVendorId(req.user.companyId, data.vendorId);

      const created = await tx.dailyScheduleEntry.create({
        data: {
          projectId,
          date: dateObj,
          content: data.content.trim(),
          category: data.category?.trim() || null,
          vendorId,
          orderIndex: nextOrder,
          createdById: req.user.id,
          updatedById: req.user.id,
        },
      });

      await recordChange(tx, {
        projectId,
        date: dateObj,
        entryId: created.id,
        action: 'ADD',
        newContent: created.content,
        newCategory: created.category,
        userId: req.user.id,
        userName,
      });

      return created;
    });

    res.status(201).json({ entry });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// PATCH /api/projects/:projectId/schedules/:id
// ============================================
const updateSchema = z.object({
  content: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  orderIndex: z.number().int().optional(),
});

projectRouter.patch('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const data = updateSchema.parse(req.body);

    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.dailyScheduleEntry.findFirst({
      where: { id, projectId },
    });
    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    const userName = await getUserName(req.user.id);

    const vendorIdResolved = data.vendorId !== undefined
      ? await resolveVendorId(req.user.companyId, data.vendorId)
      : undefined;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.dailyScheduleEntry.update({
        where: { id },
        data: {
          ...(data.content !== undefined && { content: data.content.trim() }),
          ...(data.category !== undefined && { category: data.category?.trim() || null }),
          ...(vendorIdResolved !== undefined && { vendorId: vendorIdResolved }),
          ...(data.orderIndex !== undefined && { orderIndex: data.orderIndex }),
          updatedById: req.user.id,
        },
      });

      const contentChanged =
        data.content !== undefined && data.content.trim() !== existing.content;
      const newCategoryVal = data.category !== undefined ? (data.category?.trim() || null) : existing.category;
      const categoryChanged =
        data.category !== undefined && newCategoryVal !== existing.category;

      if (contentChanged || categoryChanged) {
        await recordChange(tx, {
          projectId,
          date: existing.date,
          entryId: id,
          action: 'UPDATE',
          oldContent: existing.content,
          newContent: u.content,
          oldCategory: existing.category,
          newCategory: u.category,
          userId: req.user.id,
          userName,
        });
      }

      return u;
    });

    res.json({ entry: updated });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// DELETE /api/projects/:projectId/schedules/:id
// ============================================
projectRouter.delete('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.dailyScheduleEntry.findFirst({
      where: { id, projectId },
    });
    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    const userName = await getUserName(req.user.id);

    await prisma.$transaction(async (tx) => {
      await tx.dailyScheduleEntry.delete({ where: { id } });
      await recordChange(tx, {
        projectId,
        date: existing.date,
        entryId: null,
        action: 'DELETE',
        oldContent: existing.content,
        oldCategory: existing.category,
        userId: req.user.id,
        userName,
      });
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// ============================================
// POST /api/projects/:projectId/schedules/:id/toggle-confirm
// ============================================
projectRouter.post('/:id/toggle-confirm', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;

    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.dailyScheduleEntry.findFirst({
      where: { id, projectId },
    });
    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    const userName = await getUserName(req.user.id);
    const newConfirmed = !existing.confirmed;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.dailyScheduleEntry.update({
        where: { id },
        data: {
          confirmed: newConfirmed,
          confirmedAt: newConfirmed ? new Date() : null,
        },
      });
      await recordChange(tx, {
        projectId,
        date: existing.date,
        entryId: id,
        action: newConfirmed ? 'CONFIRM' : 'UNCONFIRM',
        oldContent: existing.content,
        newContent: existing.content,
        userId: req.user.id,
        userName,
      });
      return u;
    });

    res.json({ entry: updated });
  } catch (e) {
    next(e);
  }
});

// ============================================
// GET /api/schedules?start=YYYY-MM-DD&end=YYYY-MM-DD&status=PLANNED,IN_PROGRESS&projectIds=a,b,c
// (회사 전체)
// ============================================
globalRouter.get('/', async (req, res, next) => {
  try {
    const { start, end, status, projectIds } = req.query;

    const projectWhere = { companyId: req.user.companyId };
    if (status) {
      const arr = String(status).split(',').map((s) => s.trim()).filter(Boolean);
      if (arr.length === 1) projectWhere.status = arr[0];
      else if (arr.length > 1) projectWhere.status = { in: arr };
    }

    const where = { project: projectWhere };
    if (projectIds) {
      const ids = String(projectIds).split(',').map((s) => s.trim()).filter(Boolean);
      if (ids.length) where.projectId = { in: ids };
    }
    if (start || end) {
      where.date = {};
      if (start) where.date.gte = new Date(start);
      if (end) where.date.lte = new Date(end);
    }
    const entries = await prisma.dailyScheduleEntry.findMany({
      where,
      include: {
        project: { select: { id: true, name: true, status: true } },
        vendor: { select: { id: true, name: true, category: true } },
      },
      orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }],
    });
    res.json({ entries });
  } catch (e) {
    next(e);
  }
});

// ============================================
// GET /api/schedules/extract?keyword=...&from=YYYY-MM-DD   (회사 전체)
// ============================================
globalRouter.get('/extract', async (req, res, next) => {
  try {
    const keyword = (req.query.keyword || '').trim();
    const { from } = req.query;
    if (!keyword) return res.status(400).json({ error: 'keyword 필요' });

    const where = {
      project: { companyId: req.user.companyId },
      OR: [
        { content: { contains: keyword, mode: 'insensitive' } },
        { category: { contains: keyword, mode: 'insensitive' } },
      ],
    };
    if (from) where.date = { gte: new Date(from) };

    const entries = await prisma.dailyScheduleEntry.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, siteAddress: true },
        },
      },
      orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }],
    });

    res.json({ keyword, entries });
  } catch (e) {
    next(e);
  }
});

module.exports = { projectRouter, globalRouter };
