const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { requireFeature } = require('../middlewares/requireFeature');
const { F } = require('../services/features');
const { buildSeedRows } = require('../services/phaseKeywordSeed');
const { invalidateCache } = require('../services/phaseDetect');
const { normalizePhase } = require('../services/phases');

const router = express.Router();
router.use(authRequired);

const requireEdit = requireFeature(F.SETTINGS_PHASE_KEYWORDS);

// GET /api/phase-keywords?phase=철거
router.get('/', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    // lazy 자동 시드 — 회사 키워드가 0건이면 표준 키워드 자동 시드.
    // (가입 시 자동 시드가 누락됐거나 옛 회사 백필용. 일부라도 있으면 사용자 의도
    //  존중해서 자동 시드 안 함 — 사용자는 "📋 기본 시드 (재시드)" 버튼으로 수동 보충 가능)
    const totalCount = await prisma.phaseKeywordRule.count({ where: { companyId } });
    if (totalCount === 0) {
      const rows = buildSeedRows().map((r) => ({ ...r, companyId }));
      await prisma.phaseKeywordRule.createMany({ data: rows, skipDuplicates: true });
      invalidateCache(companyId);
    }

    const where = { companyId };
    if (req.query.phase) where.phase = req.query.phase;
    const rules = await prisma.phaseKeywordRule.findMany({
      where,
      orderBy: [{ phase: 'asc' }, { keyword: 'asc' }],
    });
    res.json({ rules });
  } catch (e) {
    next(e);
  }
});

// POST /api/phase-keywords/seed
router.post('/seed', requireEdit, async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const existing = await prisma.phaseKeywordRule.count({ where: { companyId } });
    if (existing > 0 && !req.body?.force) {
      return res.status(409).json({
        error: '이미 키워드 규칙이 존재합니다. force:true 로 덮어쓸 수 있습니다',
        existing,
      });
    }
    if (req.body?.force && existing > 0) {
      await prisma.phaseKeywordRule.deleteMany({ where: { companyId } });
    }
    const rows = buildSeedRows().map((r) => ({ ...r, companyId }));
    const result = await prisma.phaseKeywordRule.createMany({
      data: rows,
      skipDuplicates: true,
    });
    invalidateCache(companyId);
    res.status(201).json({ ok: true, created: result.count });
  } catch (e) {
    next(e);
  }
});

const upsertSchema = z.object({
  keyword: z.string().min(1),
  // 표준 25개에 자동 흡수. 매핑 실패 시 '기타'로 저장 (closed 척추 정책)
  phase: z.string().min(1).transform((v) => normalizePhase(v).label),
  active: z.boolean().optional(),
});

// POST /api/phase-keywords
router.post('/', requireEdit, async (req, res, next) => {
  try {
    const data = upsertSchema.parse(req.body);
    const rule = await prisma.phaseKeywordRule.create({
      data: {
        companyId: req.user.companyId,
        keyword: data.keyword.trim(),
        phase: data.phase.trim(),
        active: data.active ?? true,
      },
    });
    invalidateCache(req.user.companyId);
    res.status(201).json({ rule });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    if (e.code === 'P2002') {
      // 어느 phase에 이미 있는지 함께 알려줘 사용자 혼란 방지
      const existing = await prisma.phaseKeywordRule.findFirst({
        where: { companyId: req.user.companyId, keyword: req.body?.keyword?.trim() },
        select: { phase: true, active: true },
      });
      const phaseHint = existing ? `"${existing.phase}" 공정` : '다른 공정';
      return res.status(409).json({
        error: `이미 등록된 키워드입니다 (${phaseHint}에 있음).`,
        existingPhase: existing?.phase || null,
        existingActive: existing?.active ?? null,
      });
    }
    next(e);
  }
});

// PATCH /api/phase-keywords/:id
router.patch('/:id', requireEdit, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.phaseKeywordRule.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const data = upsertSchema.partial().parse(req.body);
    const rule = await prisma.phaseKeywordRule.update({
      where: { id },
      data: {
        ...(data.keyword !== undefined && { keyword: data.keyword.trim() }),
        ...(data.phase !== undefined && { phase: data.phase.trim() }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
    invalidateCache(req.user.companyId);
    res.json({ rule });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    if (e.code === 'P2002') {
      return res.status(409).json({ error: '이미 등록된 키워드입니다' });
    }
    next(e);
  }
});

// DELETE /api/phase-keywords/:id
router.delete('/:id', requireEdit, async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.phaseKeywordRule.findFirst({
      where: { id, companyId: req.user.companyId },
    });
    if (!existing) return res.status(404).json({ error: 'Not found' });
    await prisma.phaseKeywordRule.delete({ where: { id } });
    invalidateCache(req.user.companyId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
