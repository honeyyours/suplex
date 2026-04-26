// 회사별 D-N 룰 + 공정 어드바이스 — 글로벌 (회사 단위)
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { PHASE_DEADLINE_DAYS } = require('../services/phaseDeadlines');
const { STANDARD_ADVICES } = require('../services/standardPhaseAdvices');

const router = express.Router();
router.use(authRequired);

// ============================================
// D-N 룰 (PhaseDeadlineRule)
// ============================================

// GET /api/phase-deadlines — 현재 회사의 룰 + 표준값 함께 반환
router.get('/deadlines', async (req, res, next) => {
  try {
    const rules = await prisma.phaseDeadlineRule.findMany({
      where: { companyId: req.user.companyId },
      orderBy: { phase: 'asc' },
    });
    res.json({ rules, defaults: PHASE_DEADLINE_DAYS });
  } catch (e) { next(e); }
});

const ruleSchema = z.object({
  phase: z.string().trim().min(1).max(100),
  daysBefore: z.number().int().min(0).max(60),
  active: z.boolean().optional(),
});

router.post('/deadlines', async (req, res, next) => {
  try {
    const data = ruleSchema.parse(req.body);
    const rule = await prisma.phaseDeadlineRule.upsert({
      where: { companyId_phase: { companyId: req.user.companyId, phase: data.phase } },
      create: { companyId: req.user.companyId, phase: data.phase, daysBefore: data.daysBefore, active: data.active ?? true },
      update: { daysBefore: data.daysBefore, active: data.active ?? true },
    });
    res.status(201).json({ rule });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

router.patch('/deadlines/:id', async (req, res, next) => {
  try {
    const existing = await prisma.phaseDeadlineRule.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Rule not found' });
    const data = ruleSchema.partial().parse(req.body);
    const rule = await prisma.phaseDeadlineRule.update({ where: { id: req.params.id }, data });
    res.json({ rule });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

router.delete('/deadlines/:id', async (req, res, next) => {
  try {
    const existing = await prisma.phaseDeadlineRule.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Rule not found' });
    await prisma.phaseDeadlineRule.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// 표준값을 회사 룰로 일괄 시드 (덮어쓰기)
router.post('/deadlines/seed-defaults', async (req, res, next) => {
  try {
    const data = Object.entries(PHASE_DEADLINE_DAYS).map(([phase, daysBefore]) => ({
      companyId: req.user.companyId,
      phase,
      daysBefore,
      active: true,
    }));
    let created = 0;
    for (const row of data) {
      await prisma.phaseDeadlineRule.upsert({
        where: { companyId_phase: { companyId: row.companyId, phase: row.phase } },
        create: row,
        update: { daysBefore: row.daysBefore },
      });
      created++;
    }
    res.json({ ok: true, count: created });
  } catch (e) { next(e); }
});

// ============================================
// 공정 어드바이스 (PhaseAdvice) — Part B에서 사용 (지금은 모델만, 라우트도 미리 추가)
// ============================================

router.get('/advices', async (req, res, next) => {
  try {
    const advices = await prisma.phaseAdvice.findMany({
      where: { companyId: req.user.companyId },
      orderBy: [{ phase: 'asc' }, { daysBefore: 'desc' }],
    });
    res.json({ advices });
  } catch (e) { next(e); }
});

const adviceSchema = z.object({
  phase: z.string().trim().min(1).max(100),
  daysBefore: z.number().int().min(-30).max(60),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  requiresPhoto: z.boolean().optional(),
  active: z.boolean().optional(),
});

router.post('/advices', async (req, res, next) => {
  try {
    const data = adviceSchema.parse(req.body);
    const advice = await prisma.phaseAdvice.create({
      data: {
        companyId: req.user.companyId,
        phase: data.phase,
        daysBefore: data.daysBefore,
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        requiresPhoto: data.requiresPhoto ?? false,
        active: data.active ?? true,
      },
    });
    res.status(201).json({ advice });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

router.patch('/advices/:id', async (req, res, next) => {
  try {
    const existing = await prisma.phaseAdvice.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Advice not found' });
    const data = adviceSchema.partial().parse(req.body);
    const advice = await prisma.phaseAdvice.update({ where: { id: req.params.id }, data });
    res.json({ advice });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

router.delete('/advices/:id', async (req, res, next) => {
  try {
    const existing = await prisma.phaseAdvice.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Advice not found' });
    await prisma.phaseAdvice.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/advices/seed-standard', async (req, res, next) => {
  try {
    let created = 0;
    let skipped = 0;
    for (const a of STANDARD_ADVICES) {
      // 중복 방지: 같은 phase + daysBefore + title 이미 있으면 스킵
      const existing = await prisma.phaseAdvice.findFirst({
        where: { companyId: req.user.companyId, phase: a.phase, daysBefore: a.daysBefore, title: a.title },
      });
      if (existing) { skipped++; continue; }
      await prisma.phaseAdvice.create({
        data: { companyId: req.user.companyId, ...a, active: true },
      });
      created++;
    }
    res.json({ ok: true, created, skipped });
  } catch (e) { next(e); }
});

module.exports = router;
