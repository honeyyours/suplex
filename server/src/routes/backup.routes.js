const express = require('express');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/backup/export?projectId=XXX   (단일 프로젝트)
// GET /api/backup/export                  (회사 전체)
router.get('/export', async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const companyId = req.user.companyId;

    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, companyId },
        include: {
          dailyScheduleEntries: { orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }] },
          checklists: { orderBy: { createdAt: 'asc' } },
          scheduleChanges: { orderBy: { createdAt: 'desc' }, take: 500 },
        },
      });
      if (!project) return res.status(404).json({ error: 'Project not found' });

      const filename = `splex_${project.name.replace(/[^\w가-힣]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.json({
        version: '1.0',
        type: 'project',
        exportedAt: new Date().toISOString(),
        project,
      });
      return;
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        projects: {
          include: {
            dailyScheduleEntries: { orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }] },
            checklists: { orderBy: { createdAt: 'asc' } },
            scheduleChanges: { orderBy: { createdAt: 'desc' }, take: 500 },
          },
        },
        vendors: true,
      },
    });

    const filename = `splex_${company.name.replace(/[^\w가-힣]+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      version: '1.0',
      type: 'company',
      exportedAt: new Date().toISOString(),
      company,
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/backup/import
// body: { data: <exported JSON>, mode: 'new' | 'overwrite', targetProjectId? }
router.post('/import', async (req, res, next) => {
  try {
    const { data, mode = 'new', targetProjectId } = req.body || {};
    if (!data || !data.version) {
      return res.status(400).json({ error: '올바른 백업 파일이 아닙니다' });
    }

    const companyId = req.user.companyId;
    const createdProjects = [];

    const projectsToImport =
      data.type === 'project' && data.project
        ? [data.project]
        : data.type === 'company' && data.company?.projects
          ? data.company.projects
          : [];

    if (projectsToImport.length === 0) {
      return res.status(400).json({ error: '복원할 프로젝트 데이터가 없습니다' });
    }

    for (const p of projectsToImport) {
      let project;

      if (mode === 'overwrite' && targetProjectId && projectsToImport.length === 1) {
        project = await prisma.project.findFirst({ where: { id: targetProjectId, companyId } });
        if (!project) return res.status(404).json({ error: 'Target project not found' });

        await prisma.$transaction([
          prisma.dailyScheduleEntry.deleteMany({ where: { projectId: project.id } }),
          prisma.projectChecklist.deleteMany({ where: { projectId: project.id } }),
          prisma.scheduleChange.deleteMany({ where: { projectId: project.id } }),
        ]);
      } else {
        project = await prisma.project.create({
          data: {
            companyId,
            createdById: req.user.id,
            name: mode === 'new' ? `${p.name} (복원)` : p.name,
            customerName: p.customerName || '(미지정)',
            customerPhone: p.customerPhone || null,
            siteAddress: p.siteAddress || '(미지정)',
            contractAmount: p.contractAmount ? Number(p.contractAmount) : null,
            startDate: p.startDate ? new Date(p.startDate) : null,
            expectedEndDate: p.expectedEndDate ? new Date(p.expectedEndDate) : null,
            status: p.status || 'PLANNED',
            memo: p.memo || null,
          },
        });
      }

      if (p.dailyScheduleEntries?.length) {
        await prisma.dailyScheduleEntry.createMany({
          data: p.dailyScheduleEntries.map((e) => ({
            projectId: project.id,
            date: new Date(e.date),
            category: e.category || null,
            content: e.content,
            confirmed: !!e.confirmed,
            confirmedAt: e.confirmedAt ? new Date(e.confirmedAt) : null,
            orderIndex: e.orderIndex || 0,
            createdById: req.user.id,
            updatedById: req.user.id,
          })),
        });
      }

      if (p.checklists?.length) {
        await prisma.projectChecklist.createMany({
          data: p.checklists.map((c) => ({
            projectId: project.id,
            title: c.title,
            category: c.category || 'GENERAL',
            phase: c.phase || null,
            isDone: !!c.isDone,
            dueDate: c.dueDate ? new Date(c.dueDate) : null,
            completedAt: c.completedAt ? new Date(c.completedAt) : null,
            completedById: c.isDone ? req.user.id : null,
            createdById: req.user.id,
            orderIndex: c.orderIndex || 0,
          })),
        });
      }

      createdProjects.push({ id: project.id, name: project.name });
    }

    res.json({ ok: true, projects: createdProjects });
  } catch (e) {
    console.error('import error:', e);
    next(e);
  }
});

module.exports = router;
