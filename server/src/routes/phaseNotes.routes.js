// 견적상담 — 공정별 참조 메모 + 기본 메모. 견적 작성 시 보고 입력하는 노트.
// (projectId, phase) unique. phase='GENERAL' = 기본 메모(공정 무관), 그 외 = 표준 25공정 라벨.
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router({ mergeParams: true });
router.use(authRequired);

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

// 응답 가공: updatedBy를 { id, name, role } 형태로 (현재 회사 멤버십 role 포함)
function shapeNote(n, companyId) {
  if (!n) return null;
  let updatedBy = null;
  if (n.updatedBy) {
    const role = n.updatedBy.memberships?.[0]?.role || null;
    updatedBy = { id: n.updatedBy.id, name: n.updatedBy.name, role };
  }
  return {
    id: n.id,
    phase: n.phase,
    body: n.body,
    updatedAt: n.updatedAt,
    createdAt: n.createdAt,
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

// GET /api/projects/:projectId/phase-notes
router.get('/', async (req, res, next) => {
  try {
    const project = await ensureProjectAccess(req, res);
    if (!project) return;
    const notes = await prisma.projectPhaseNote.findMany({
      where: { projectId: project.id },
      include: includeUpdatedBy(req.user.companyId),
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ notes: notes.map((n) => shapeNote(n, req.user.companyId)) });
  } catch (e) { next(e); }
});

// PUT /api/projects/:projectId/phase-notes
// body: { phase, body }
// upsert. body가 빈 문자열(트림 후)이면 row 삭제.
const upsertSchema = z.object({
  phase: z.string().min(1).max(100),
  body: z.string().max(20000),
});

router.put('/', async (req, res, next) => {
  try {
    const project = await ensureProjectAccess(req, res);
    if (!project) return;
    const data = upsertSchema.parse(req.body || {});
    const trimmed = data.body.trim();

    if (!trimmed) {
      // 빈 메모 → row 삭제 (있으면)
      await prisma.projectPhaseNote.deleteMany({
        where: { projectId: project.id, phase: data.phase },
      });
      return res.json({ note: null, phase: data.phase, deleted: true });
    }

    const note = await prisma.projectPhaseNote.upsert({
      where: { projectId_phase: { projectId: project.id, phase: data.phase } },
      create: {
        projectId: project.id,
        phase: data.phase,
        body: trimmed,
        updatedById: req.user.id,
      },
      update: {
        body: trimmed,
        updatedById: req.user.id,
      },
      include: includeUpdatedBy(req.user.companyId),
    });
    res.json({ note: shapeNote(note, req.user.companyId) });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validation failed', details: e.errors });
    next(e);
  }
});

// DELETE /api/projects/:projectId/phase-notes/:phase — 명시적 삭제
router.delete('/:phase', async (req, res, next) => {
  try {
    const project = await ensureProjectAccess(req, res);
    if (!project) return;
    await prisma.projectPhaseNote.deleteMany({
      where: { projectId: project.id, phase: req.params.phase },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
