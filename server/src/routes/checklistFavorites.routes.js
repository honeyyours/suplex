// 체크리스트 즐겨찾기 — 회사 단위 마스터 (2026-05-17 신설)
// 봉기님 요청: 회사가 반복적으로 챙기는 체크리스트 항목을 회사 자산으로 저장.
// 새 프로젝트 만들 때 "이거 잊지 않으셨나요?" 모달로 일괄 추천.
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');

const router = express.Router();

const CATEGORIES = ['GENERAL', 'CLIENT_REQUEST', 'DESIGN_TO_FIELD', 'TOUCH_UP', 'URGENT'];
const TEAMS = ['FIELD', 'DESIGN', 'ORDER', 'OTHER'];

// GET /api/checklist-favorites — 회사 즐겨찾기 목록
router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.checklistFavorite.findMany({
      where: { companyId: req.user.companyId },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ items });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  title: z.string().min(1),
  phase: z.string().optional().nullable(),
  category: z.enum(CATEGORIES).optional(),
  team: z.enum(TEAMS).optional(),
  requiresPhoto: z.boolean().optional(),
  daysBefore: z.number().int().optional().nullable(),
});

// POST /api/checklist-favorites — 새 즐겨찾기 항목 등록
router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const created = await prisma.checklistFavorite.create({
      data: {
        companyId: req.user.companyId,
        title: data.title.trim(),
        phase: data.phase?.trim() || null,
        category: data.category || 'GENERAL',
        team: data.team || 'OTHER',
        requiresPhoto: !!data.requiresPhoto,
        daysBefore: data.daysBefore ?? null,
        createdById: req.user.id,
      },
    });
    res.status(201).json({ item: created });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// PATCH /api/checklist-favorites/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const data = createSchema.partial().parse(req.body);
    const existing = await prisma.checklistFavorite.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Favorite not found' });
    const patch = {};
    if (data.title !== undefined) patch.title = data.title.trim();
    if (data.phase !== undefined) patch.phase = data.phase?.trim() || null;
    if (data.category !== undefined) patch.category = data.category;
    if (data.team !== undefined) patch.team = data.team;
    if (data.requiresPhoto !== undefined) patch.requiresPhoto = !!data.requiresPhoto;
    if (data.daysBefore !== undefined) patch.daysBefore = data.daysBefore;
    const updated = await prisma.checklistFavorite.update({
      where: { id: req.params.id },
      data: patch,
    });
    res.json({ item: updated });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// DELETE /api/checklist-favorites/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.checklistFavorite.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Favorite not found' });
    await prisma.checklistFavorite.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /api/projects/:projectId/checklists/apply-favorites
// 선택된 즐겨찾기 항목들을 프로젝트 체크리스트로 일괄 추가
const applySchema = z.object({
  favoriteIds: z.array(z.string()).min(1),
});

router.post('/apply/:projectId', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const data = applySchema.parse(req.body);

    const project = await prisma.project.findFirst({
      where: { id: projectId, companyId: req.user.companyId },
      select: { id: true, startDate: true },
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const favs = await prisma.checklistFavorite.findMany({
      where: { id: { in: data.favoriteIds }, companyId: req.user.companyId },
    });
    if (favs.length === 0) return res.status(404).json({ error: 'No favorites found' });

    const created = await prisma.$transaction(
      favs.map((f) => {
        let dueDate = null;
        if (f.daysBefore != null && project.startDate) {
          const d = new Date(project.startDate);
          d.setDate(d.getDate() - f.daysBefore);
          dueDate = d;
        }
        return prisma.projectChecklist.create({
          data: {
            projectId,
            title: f.title,
            phase: f.phase,
            category: f.category,
            team: f.team,
            requiresPhoto: f.requiresPhoto,
            dueDate,
            createdById: req.user.id,
          },
        });
      })
    );
    res.status(201).json({ created: created.length });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

module.exports = router;
