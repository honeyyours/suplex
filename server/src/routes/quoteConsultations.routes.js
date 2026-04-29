// 견적상담 — 프로젝트 단위 통화·미팅·카톡 기록 (시간 역순 카드 타임라인)
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

const CHANNELS = ['PHONE', 'KAKAO', 'MEETING', 'EMAIL', 'ZOOM'];
const REACTIONS = ['POSITIVE', 'NEUTRAL', 'NEGATIVE', 'DECIDED'];

// 회사 격리 — 프로젝트가 내 회사 소속인지 확인
async function ensureProjectAccess(req, res) {
  const project = await prisma.project.findFirst({
    where: { id: req.params.projectId, companyId: req.user.companyId },
    select: { id: true },
  });
  if (!project) {
    res.status(404).json({ error: '프로젝트를 찾을 수 없습니다' });
    return null;
  }
  return project;
}

// GET /api/projects/:projectId/quote-consultations — 시간 역순
router.get('/', async (req, res, next) => {
  try {
    const project = await ensureProjectAccess(req, res);
    if (!project) return;
    const items = await prisma.quoteConsultation.findMany({
      where: { projectId: project.id },
      orderBy: { occurredAt: 'desc' },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    res.json({ items });
  } catch (e) { next(e); }
});

const createSchema = z.object({
  occurredAt: z.string().datetime().optional(), // 미지정 시 서버 now
  channel: z.enum(CHANNELS),
  topic: z.string().max(50).optional().nullable(),
  body: z.string().min(1).max(20000),
  nextAction: z.string().max(500).optional().nullable(),
  attendee: z.string().max(100).optional().nullable(),
  reaction: z.enum(REACTIONS).optional().nullable(),
  quoteRound: z.number().int().min(1).max(99).optional().nullable(),
});

router.post('/', async (req, res, next) => {
  try {
    const project = await ensureProjectAccess(req, res);
    if (!project) return;
    const data = createSchema.parse(req.body || {});
    const item = await prisma.quoteConsultation.create({
      data: {
        projectId: project.id,
        occurredAt: data.occurredAt ? new Date(data.occurredAt) : new Date(),
        channel: data.channel,
        topic: data.topic?.trim() || null,
        body: data.body.trim(),
        nextAction: data.nextAction?.trim() || null,
        attendee: data.attendee?.trim() || null,
        reaction: data.reaction || null,
        quoteRound: data.quoteRound ?? null,
        authorId: req.user.id,
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ item });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

const updateSchema = createSchema.partial();

router.patch('/:id', async (req, res, next) => {
  try {
    const project = await ensureProjectAccess(req, res);
    if (!project) return;
    const existing = await prisma.quoteConsultation.findFirst({
      where: { id: req.params.id, projectId: project.id },
    });
    if (!existing) return res.status(404).json({ error: '찾을 수 없습니다' });
    const data = updateSchema.parse(req.body || {});

    const patch = {};
    if (data.occurredAt !== undefined) patch.occurredAt = data.occurredAt ? new Date(data.occurredAt) : existing.occurredAt;
    if (data.channel !== undefined) patch.channel = data.channel;
    if (data.topic !== undefined) patch.topic = data.topic?.trim() || null;
    if (data.body !== undefined) patch.body = data.body.trim();
    if (data.nextAction !== undefined) patch.nextAction = data.nextAction?.trim() || null;
    if (data.attendee !== undefined) patch.attendee = data.attendee?.trim() || null;
    if (data.reaction !== undefined) patch.reaction = data.reaction || null;
    if (data.quoteRound !== undefined) patch.quoteRound = data.quoteRound ?? null;

    const item = await prisma.quoteConsultation.update({
      where: { id: existing.id },
      data: patch,
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    res.json({ item });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const project = await ensureProjectAccess(req, res);
    if (!project) return;
    const existing = await prisma.quoteConsultation.findFirst({
      where: { id: req.params.id, projectId: project.id },
      select: { id: true },
    });
    if (!existing) return res.status(404).json({ error: '찾을 수 없습니다' });
    await prisma.quoteConsultation.delete({ where: { id: existing.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
