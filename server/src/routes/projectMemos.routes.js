// 프로젝트 메모 (Google Keep 패턴) — 다중 메모 카드
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

async function assertProjectAccess(projectId, companyId) {
  return prisma.project.findFirst({ where: { id: projectId, companyId } });
}

// GET /api/projects/:projectId/memos?tag=회고&q=검색어
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const where = { projectId };
    if (req.query.tag) {
      const t = String(req.query.tag).trim();
      where.tag = t === '__none__' ? null : t;
    }
    if (req.query.q) {
      const q = String(req.query.q).trim();
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ];
      }
    }

    const memos = await prisma.projectMemo.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { orderIndex: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ memos });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  content: z.string().default(''),
  tag: z.string().max(50).optional().nullable(),
  pinned: z.boolean().optional(),
});

router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const data = createSchema.parse(req.body);
    const last = await prisma.projectMemo.findFirst({
      where: { projectId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    });
    const memo = await prisma.projectMemo.create({
      data: {
        projectId,
        title: data.title?.trim() || null,
        content: data.content || '',
        tag: data.tag?.trim() || null,
        pinned: data.pinned ?? false,
        orderIndex: (last?.orderIndex ?? -1) + 1,
      },
    });
    res.status(201).json({ memo });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

const patchSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  content: z.string().optional(),
  tag: z.string().max(50).optional().nullable(),
  pinned: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.projectMemo.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Memo not found' });

    const data = patchSchema.parse(req.body);
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title?.trim() || null;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.tag !== undefined) updateData.tag = data.tag?.trim() || null;
    if (data.pinned !== undefined) updateData.pinned = data.pinned;
    if (data.orderIndex !== undefined) updateData.orderIndex = data.orderIndex;

    const memo = await prisma.projectMemo.update({ where: { id }, data: updateData });
    res.json({ memo });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { projectId, id } = req.params;
    const project = await assertProjectAccess(projectId, req.user.companyId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const existing = await prisma.projectMemo.findFirst({ where: { id, projectId } });
    if (!existing) return res.status(404).json({ error: 'Memo not found' });

    await prisma.projectMemo.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
