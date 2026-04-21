const express = require('express');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const projectRouter = express.Router({ mergeParams: true });
const globalRouter = express.Router();

projectRouter.use(authRequired);
globalRouter.use(authRequired);

function parseDateFilter(query) {
  const { days, from, to } = query;
  const where = {};
  if (from || to || days) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
    if (days && !from) {
      const d = Number(days);
      if (!Number.isNaN(d) && d > 0) {
        where.createdAt.gte = new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      }
    }
  }
  return where.createdAt ? where : {};
}

// GET /api/projects/:projectId/schedule-changes?days=3
projectRouter.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: req.user.companyId },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = { projectId, ...parseDateFilter(req.query) };
    const changes = await prisma.scheduleChange.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json({ changes, project: { id: project.id, name: project.name } });
  } catch (e) {
    next(e);
  }
});

// GET /api/schedule-changes?days=3    (회사 전체)
globalRouter.get('/', async (req, res, next) => {
  try {
    const where = {
      project: { companyId: req.user.companyId },
      ...parseDateFilter(req.query),
    };
    const changes = await prisma.scheduleChange.findMany({
      where,
      include: { project: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    res.json({ changes });
  } catch (e) {
    next(e);
  }
});

module.exports = { projectRouter, globalRouter };
