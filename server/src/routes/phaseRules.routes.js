// 회사별 D-N 룰 + 공정 어드바이스 — 글로벌 (회사 단위)
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { PHASE_DEADLINE_DAYS } = require('../services/phaseDeadlines');

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

// 표준 어드바이스 시드 (인테리어 도메인 노하우)
const STANDARD_ADVICES = [
  { phase: '철거', daysBefore: 3,  title: '관리실 협의 — 보양/엘리베이터/소음 시간', category: '관리실 협의' },
  { phase: '철거', daysBefore: 1,  title: '입구·복도·엘리베이터 보양 작업', category: '안전' },
  { phase: '설비', daysBefore: 3,  title: '분배기 위치 확인 / 가스 차단 일정 협의', category: '관리실 협의' },
  { phase: '전기', daysBefore: 1,  title: '도면 최종 점검 — 콘센트/스위치 위치', category: '사전 준비' },
  { phase: '목공', daysBefore: 7,  title: '합판·각재 발주 확인', category: '자재' },
  { phase: '목공', daysBefore: 1,  title: '도면 최종 점검 + 자재 적치 위치 확보', category: '사전 준비' },
  { phase: '타일', daysBefore: 3,  title: '타일 색상/사이즈 최종 확정 + 본드/메지 준비', category: '자재' },
  { phase: '도배', daysBefore: 2,  title: '도배지 검수, 본드/풀 도착 확인', category: '자재' },
  { phase: '도배', daysBefore: 1,  title: '벽면 보수 / 퍼티 마감 점검', category: '사전 준비' },
  { phase: '욕실', daysBefore: 3,  title: '방수 시공 일정 / 도기·수전 모델 최종 확정', category: '자재' },
  { phase: '도장', daysBefore: 3,  title: '도장 색상 컨펌 + 시너 환기 계획', category: '안전' },
  { phase: '필름', daysBefore: 2,  title: '필름 도착 확인 + 기존 실리콘 제거 준비', category: '사전 준비' },
  { phase: '가구', daysBefore: 7,  title: '가구 도면 최종 발주 + 사이즈 재확인', category: '자재' },
  { phase: '가전', daysBefore: 7,  title: '가전 모델 사이즈 최종 확정 + 빌트인 타공 도면', category: '자재' },
  { phase: '입주', daysBefore: 7,  title: '청소 업체 예약 + 입주 전 사진 점검 일정', category: '사전 준비' },
  { phase: '입주', daysBefore: 1,  title: '잔손 리스트 확정 + 전기·가스 검침', category: '사전 준비' },
];

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
