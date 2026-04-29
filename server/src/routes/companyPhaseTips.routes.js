// 회사 단위 견적 가이드 — 공정별 회사 내부 유의사항/메모.
// 견적 작성 화면 우측 드로어에서 표시(화면 전용, PDF/프린트 X).
// (companyId, phase) unique. phase='GENERAL' = 전체 공통, 그 외 = 표준 25공정 라벨.
//
// 권한:
//   - 보기(GET): 회사 멤버 누구나
//   - 편집(PUT/DELETE): SETTINGS_QUOTE_GUIDE 권한 보유자 (OWNER 디폴트, OWNER가 직원에게 부여 가능)
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { requireFeature } = require('../middlewares/requireFeature');
const { F } = require('../services/features');
const { normalizePhase } = require('../services/phases');

const router = express.Router();
router.use(authRequired);

const requireEdit = requireFeature(F.SETTINGS_QUOTE_GUIDE);

function shapeTip(t) {
  if (!t) return null;
  let updatedBy = null;
  if (t.updatedBy) {
    const role = t.updatedBy.memberships?.[0]?.role || null;
    updatedBy = { id: t.updatedBy.id, name: t.updatedBy.name, role };
  }
  return {
    id: t.id,
    phase: t.phase,
    body: t.body,
    updatedAt: t.updatedAt,
    createdAt: t.createdAt,
    updatedBy,
  };
}

const includeUpdatedBy = (companyId) => ({
  updatedBy: {
    select: {
      id: true,
      name: true,
      memberships: {
        where: { companyId },
        select: { role: true },
      },
    },
  },
});

// GET /api/company-phase-tips
router.get('/', async (req, res, next) => {
  try {
    const tips = await prisma.companyPhaseTip.findMany({
      where: { companyId: req.user.companyId },
      include: includeUpdatedBy(req.user.companyId),
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ tips: tips.map(shapeTip) });
  } catch (e) { next(e); }
});

// PUT /api/company-phase-tips
// body: { phase, body }. body가 빈 문자열(트림 후)이면 삭제.
// phase는 'GENERAL' 또는 표준 라벨로 정규화.
const upsertSchema = z.object({
  phase: z.string().trim().min(1).max(100),
  body: z.string().max(20000),
});

router.put('/', requireEdit, async (req, res, next) => {
  try {
    const data = upsertSchema.parse(req.body || {});
    // 'GENERAL' sentinel은 그대로, 그 외는 표준 라벨로 정규화 (closed 25공정 정책)
    const phase = data.phase === 'GENERAL' ? 'GENERAL' : normalizePhase(data.phase).label;
    const trimmed = data.body.trim();

    if (!trimmed) {
      await prisma.companyPhaseTip.deleteMany({
        where: { companyId: req.user.companyId, phase },
      });
      return res.json({ tip: null, phase, deleted: true });
    }

    const tip = await prisma.companyPhaseTip.upsert({
      where: { companyId_phase: { companyId: req.user.companyId, phase } },
      create: {
        companyId: req.user.companyId,
        phase,
        body: trimmed,
        updatedById: req.user.id,
      },
      update: {
        body: trimmed,
        updatedById: req.user.id,
      },
      include: includeUpdatedBy(req.user.companyId),
    });
    res.json({ tip: shapeTip(tip) });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// DELETE /api/company-phase-tips/:phase — 명시적 삭제
router.delete('/:phase', requireEdit, async (req, res, next) => {
  try {
    await prisma.companyPhaseTip.deleteMany({
      where: { companyId: req.user.companyId, phase: req.params.phase },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
