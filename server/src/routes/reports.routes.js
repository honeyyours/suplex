const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

const includeMeta = {
  author: { select: { id: true, name: true } },
};

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

async function attachPhotos(reports, projectId) {
  const ids = reports.map((r) => r.id);
  if (ids.length === 0) return reports;
  const photos = await prisma.projectPhoto.findMany({
    where: { projectId, source: 'REPORT', sourceId: { in: ids } },
    orderBy: { createdAt: 'asc' },
  });
  const byReport = {};
  photos.forEach((p) => {
    (byReport[p.sourceId] = byReport[p.sourceId] || []).push(p);
  });
  return reports.map((r) => ({ ...r, photos: byReport[r.id] || [] }));
}

// GET /api/projects/:projectId/reports?from=&to=
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = { projectId };
    if (req.query.from || req.query.to) {
      where.reportDate = {};
      if (req.query.from) where.reportDate.gte = new Date(req.query.from);
      if (req.query.to) where.reportDate.lte = new Date(req.query.to);
    }

    let reports = await prisma.dailyReport.findMany({
      where,
      include: includeMeta,
      orderBy: [{ reportDate: 'desc' }, { createdAt: 'desc' }],
      take: 200,
    });
    reports = await attachPhotos(reports, projectId);
    res.json({ reports });
  } catch (e) {
    next(e);
  }
});

const schema = z.object({
  reportDate: z.string(),              // YYYY-MM-DD
  category: z.string().min(1),
  progress: z.number().int().min(0).max(100).optional(),
  workerCount: z.number().int().min(0).optional().nullable(),
  memo: z.string().optional().nullable(),
  nextDayPlan: z.string().optional().nullable(),
});

// POST /api/projects/:projectId/reports
router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = schema.parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const report = await prisma.dailyReport.create({
      data: {
        projectId,
        authorId: req.user.id,
        reportDate: new Date(data.reportDate),
        category: data.category.trim(),
        progress: data.progress ?? 0,
        workerCount: data.workerCount ?? null,
        memo: data.memo?.trim() || null,
        nextDayPlan: data.nextDayPlan?.trim() || null,
      },
      include: includeMeta,
    });
    res.status(201).json({ report });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// PATCH /api/projects/:projectId/reports/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const data = schema.partial().parse(req.body);
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.dailyReport.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Report not found' });

    // FIELD 권한자는 본인 작성 건만 수정 가능
    if (req.user.role === 'FIELD' && existing.authorId !== req.user.id) {
      return res.status(403).json({ error: '본인이 작성한 보고만 수정할 수 있습니다' });
    }

    const updated = await prisma.dailyReport.update({
      where: { id },
      data: {
        ...(data.reportDate !== undefined && { reportDate: new Date(data.reportDate) }),
        ...(data.category !== undefined && { category: data.category.trim() }),
        ...(data.progress !== undefined && { progress: data.progress }),
        ...(data.workerCount !== undefined && { workerCount: data.workerCount }),
        ...(data.memo !== undefined && { memo: data.memo?.trim() || null }),
        ...(data.nextDayPlan !== undefined && { nextDayPlan: data.nextDayPlan?.trim() || null }),
      },
      include: includeMeta,
    });
    res.json({ report: updated });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// DELETE /api/projects/:projectId/reports/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.dailyReport.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Report not found' });

    if (req.user.role === 'FIELD' && existing.authorId !== req.user.id) {
      return res.status(403).json({ error: '본인이 작성한 보고만 삭제할 수 있습니다' });
    }

    // 관련 사진도 함께 삭제
    await prisma.$transaction([
      prisma.projectPhoto.deleteMany({ where: { projectId, source: 'REPORT', sourceId: id } }),
      prisma.dailyReport.delete({ where: { id } }),
    ]);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
