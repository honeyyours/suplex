// 회사별 D-N 룰 + 공정 어드바이스 — 글로벌 (회사 단위)
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { requireFeature } = require('../middlewares/requireFeature');
const { F } = require('../services/features');
const { PHASE_DEADLINE_DAYS } = require('../services/phaseDeadlines');
const { STANDARD_ADVICES } = require('../services/standardPhaseAdvices');
const { normalizePhase } = require('../services/phases');
const { resetBundleFromPreset, BUNDLES } = require('../services/phasePreset');

const router = express.Router();
router.use(authRequired);

const requireDeadlinesEdit = requireFeature(F.SETTINGS_PHASE_DEADLINES);
const requireAdviceEdit = requireFeature(F.SETTINGS_PHASE_ADVICE);

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
  // 표준 25개에 자동 흡수 (closed 척추 정책)
  phase: z.string().trim().min(1).max(100).transform((v) => normalizePhase(v).label),
  daysBefore: z.number().int().min(0).max(60),
  active: z.boolean().optional(),
});

router.post('/deadlines', requireDeadlinesEdit, async (req, res, next) => {
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

router.patch('/deadlines/:id', requireDeadlinesEdit, async (req, res, next) => {
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

router.delete('/deadlines/:id', requireDeadlinesEdit, async (req, res, next) => {
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
router.post('/deadlines/seed-defaults', requireDeadlinesEdit, async (req, res, next) => {
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

const RULE_TYPES = ['STANDARD', 'UNCONFIRMED_CHECK'];
const SYSTEM_PHASE_LABEL = '시스템'; // 메타 phase — closed 25 외, ruleType=UNCONFIRMED_CHECK 전용

// phase 정규화: 시스템 룰은 normalizePhase 우회(시스템에어컨으로 흡수되는 alias 충돌 회피).
function resolvePhase(rawPhase, ruleType) {
  if (ruleType === 'UNCONFIRMED_CHECK') return SYSTEM_PHASE_LABEL;
  return normalizePhase(rawPhase).label;
}

const adviceSchema = z.object({
  // 표준 25개에 자동 흡수 (closed 척추 정책). ruleType=UNCONFIRMED_CHECK 면 phase는 강제로 "시스템".
  phase: z.string().trim().min(1).max(100),
  ruleType: z.enum(RULE_TYPES).optional(),
  daysBefore: z.number().int().min(-30).max(60),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().max(50).optional().nullable(),
  requiresPhoto: z.boolean().optional(),
  active: z.boolean().optional(),
});

router.post('/advices', requireAdviceEdit, async (req, res, next) => {
  try {
    const data = adviceSchema.parse(req.body);
    const ruleType = data.ruleType || 'STANDARD';
    // 시스템 룰은 가입 시 자동 시드만 — 사용자가 임의로 추가 X (활성/비활성 토글만 허용)
    if (ruleType === 'UNCONFIRMED_CHECK') {
      return res.status(400).json({ error: '시스템 룰은 기본 제공이며 임의로 추가할 수 없습니다.' });
    }
    const advice = await prisma.phaseAdvice.create({
      data: {
        companyId: req.user.companyId,
        phase: resolvePhase(data.phase, ruleType),
        ruleType,
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

router.patch('/advices/:id', requireAdviceEdit, async (req, res, next) => {
  try {
    const existing = await prisma.phaseAdvice.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Advice not found' });
    const data = adviceSchema.partial().parse(req.body);
    // 시스템 룰은 active 토글만 허용 — 본문/제목/D-N/타입 등 변경 차단
    if (existing.ruleType === 'UNCONFIRMED_CHECK') {
      const allowedKeys = ['active'];
      const violation = Object.keys(data).find((k) => !allowedKeys.includes(k));
      if (violation) {
        return res.status(400).json({ error: '시스템 룰은 활성/비활성만 변경할 수 있습니다.' });
      }
    }
    // phase 변경 요청이 있으면 ruleType(요청값 또는 기존값) 기준으로 정규화
    const patch = { ...data };
    if (data.phase !== undefined) {
      const effectiveRuleType = data.ruleType || existing.ruleType || 'STANDARD';
      patch.phase = resolvePhase(data.phase, effectiveRuleType);
    } else if (data.ruleType && data.ruleType !== existing.ruleType) {
      // ruleType 만 바뀐 경우 phase 도 일관되게 갱신
      patch.phase = resolvePhase(existing.phase, data.ruleType);
    }
    const advice = await prisma.phaseAdvice.update({ where: { id: req.params.id }, data: patch });
    res.json({ advice });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

router.delete('/advices/:id', requireAdviceEdit, async (req, res, next) => {
  try {
    const existing = await prisma.phaseAdvice.findFirst({
      where: { id: req.params.id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Advice not found' });
    if (existing.ruleType === 'UNCONFIRMED_CHECK') {
      return res.status(400).json({ error: '시스템 룰은 삭제할 수 없습니다. 비활성으로만 끌 수 있습니다.' });
    }
    await prisma.phaseAdvice.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// 벌크 복제 — 선택 항목들을 동일 회사 안에서 통째로 복사 (시스템 룰 제외)
router.post('/advices/bulk-duplicate', requireAdviceEdit, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((x) => typeof x === 'string') : [];
    if (ids.length === 0) return res.status(400).json({ error: 'ids array required' });
    const sources = await prisma.phaseAdvice.findMany({
      where: { id: { in: ids }, companyId: req.user.companyId, ruleType: { not: 'UNCONFIRMED_CHECK' } },
    });
    const created = await prisma.$transaction(
      sources.map((s) => prisma.phaseAdvice.create({
        data: {
          companyId: s.companyId,
          phase: s.phase,
          ruleType: s.ruleType,
          daysBefore: s.daysBefore,
          title: s.title,
          description: s.description,
          category: s.category,
          requiresPhoto: s.requiresPhoto,
          active: s.active,
        },
      }))
    );
    res.status(201).json({ created: created.length, skipped: ids.length - sources.length, advices: created });
  } catch (e) { next(e); }
});

// 벌크 삭제 — 선택 항목들을 한 번에 삭제 (시스템 룰 제외)
router.post('/advices/bulk-delete', requireAdviceEdit, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((x) => typeof x === 'string') : [];
    if (ids.length === 0) return res.status(400).json({ error: 'ids array required' });
    const result = await prisma.phaseAdvice.deleteMany({
      where: { id: { in: ids }, companyId: req.user.companyId, ruleType: { not: 'UNCONFIRMED_CHECK' } },
    });
    res.json({ ok: true, deleted: result.count });
  } catch (e) { next(e); }
});

// 시스템 프리셋 리셋 — 4묶음 중 1개를 표준 회사 데이터로 갱신.
// body: { bundle: 'phaseLabels' | 'phaseKeywordRules' | 'phaseDeadlineRules' | 'phaseAdvices' }
// 권한: OWNER (어드바이스 편집 권한과 동일 가드)
router.post('/preset/reset', requireAdviceEdit, async (req, res, next) => {
  try {
    const bundle = req.body?.bundle;
    if (!BUNDLES.includes(bundle)) {
      return res.status(400).json({ error: `bundle 은 ${BUNDLES.join(' / ')} 중 하나여야 합니다.` });
    }
    const result = await resetBundleFromPreset(prisma, {
      targetCompanyId: req.user.companyId,
      bundle,
    });
    if (!result.applied) {
      const reason = result.reason === 'no-preset-source'
        ? '아직 시스템 프리셋 표준 회사가 지정되지 않았습니다.'
        : result.reason === 'same-company'
        ? '본 회사가 표준 회사로 지정돼 있어 자기 자신을 리셋할 수 없습니다.'
        : '리셋 적용 실패';
      return res.status(409).json({ error: reason, reason: result.reason });
    }
    res.json({ ok: true, bundle, count: result.count });
  } catch (e) { next(e); }
});

router.post('/advices/seed-standard', requireAdviceEdit, async (req, res, next) => {
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
