// 팀 캘린더(회사 일정) 라우트 — 2026-05-17 신설
// 봉기님 합의: 답사·미팅 일정은 프로젝트 페이지로, 회사 자체 운영 일정·견적미팅 등은 별도 메뉴.
//   - projectId 없이 입력 가능 (회사 단독 일정)
//   - projectId 연결 시 프로젝트 일정에도 함께 노출 (companyWide=true)
// DailyScheduleEntry 재사용 — projectId nullable, companyId 채워서 회사 스코프.
const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');

const router = express.Router();

// ============================================
// GET /api/company-schedules?from&to
//   회사의 팀 캘린더 항목 — companyWide=true OR (projectId=null AND companyId=me)
// ============================================
router.get('/', async (req, res, next) => {
  try {
    const { from, to, assigneeId } = req.query;
    const baseFilter = {
      OR: [
        // 회사 단독 일정 (프로젝트 없음)
        { projectId: null, companyId: req.user.companyId },
        // 회사 전체 노출 플래그 — 프로젝트 일정 + 회사 일정 양쪽 노출
        { companyWide: true, project: { companyId: req.user.companyId } },
      ],
    };
    // 나만보기(isPrivate) 권한 — 본인이 만들거나 본인이 담당자인 경우만. OWNER 우회 X.
    const privacyFilter = {
      OR: [
        { isPrivate: false },
        { isPrivate: true, AND: [{ OR: [{ createdById: req.user.id }, { assigneeId: req.user.id }] }] },
      ],
    };
    const filters = [baseFilter, privacyFilter];
    if (assigneeId === 'unassigned') filters.push({ assigneeId: null });
    else if (assigneeId) filters.push({ assigneeId });
    const where = { AND: filters };
    if (from && to) {
      where.date = { gte: new Date(from), lte: new Date(to) };
    }

    const entries = await prisma.dailyScheduleEntry.findMany({
      where,
      orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }],
      include: {
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, nickname: true } },
      },
    });
    res.json({ entries });
  } catch (e) {
    next(e);
  }
});

// ============================================
// POST /api/company-schedules
//   회사 일정 추가. projectId 선택 — 있으면 companyWide=true, 없으면 companyId만.
// ============================================
const createSchema = z.object({
  date: z.string(),
  content: z.string().min(1),
  category: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  isPrivate: z.boolean().optional(),
});

async function assertMemberOfCompany(userId, companyId) {
  if (!userId) return false;
  const m = await prisma.membership.findFirst({
    where: { userId, companyId },
    select: { id: true },
  });
  return !!m;
}

async function resolveVendorId(companyId, vendorId) {
  if (!vendorId) return null;
  const v = await prisma.vendor.findFirst({
    where: { id: vendorId, companyId },
    select: { id: true },
  });
  return v ? v.id : null;
}

async function assertProjectInCompany(projectId, companyId) {
  if (!projectId) return true;
  const p = await prisma.project.findFirst({
    where: { id: projectId, companyId },
    select: { id: true },
  });
  return !!p;
}

router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    if (data.projectId) {
      const ok = await assertProjectInCompany(data.projectId, req.user.companyId);
      if (!ok) return res.status(404).json({ error: '연결할 프로젝트를 찾을 수 없습니다' });
    }

    let assigneeId = null;
    if (data.assigneeId) {
      const ok = await assertMemberOfCompany(data.assigneeId, req.user.companyId);
      if (!ok) return res.status(404).json({ error: '담당자를 찾을 수 없습니다' });
      assigneeId = data.assigneeId;
    }

    const vendorId = await resolveVendorId(req.user.companyId, data.vendorId);

    const created = await prisma.dailyScheduleEntry.create({
      data: {
        projectId: data.projectId || null,
        companyId: req.user.companyId,
        date: new Date(data.date),
        content: data.content.trim(),
        category: data.category?.trim() || null,
        vendorId,
        assigneeId,
        isPrivate: !!data.isPrivate,
        // 프로젝트 연결된 경우 companyWide=true로 양쪽 노출. 회사 단독은 굳이 플래그 필요 없음.
        companyWide: !!data.projectId,
        createdById: req.user.id,
        updatedById: req.user.id,
      },
      include: {
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, nickname: true } },
      },
    });

    res.status(201).json({ entry: created });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// PATCH /api/company-schedules/:id
// ============================================
const updateSchema = z.object({
  date: z.string().optional(),
  content: z.string().min(1).optional(),
  category: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  isPrivate: z.boolean().optional(),
});

async function findOwned(id, userId, companyId) {
  const entry = await prisma.dailyScheduleEntry.findFirst({
    where: {
      id,
      OR: [
        { companyId },
        { project: { companyId } },
      ],
    },
  });
  if (!entry) return null;
  // 나만보기 일정이면 본인(작성자 또는 담당자)만 수정·삭제 가능
  if (entry.isPrivate && entry.createdById !== userId && entry.assigneeId !== userId) {
    return null;
  }
  return entry;
}

router.patch('/:id', async (req, res, next) => {
  try {
    const data = updateSchema.parse(req.body);
    const existing = await findOwned(req.params.id, req.user.id, req.user.companyId);
    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    const patch = {
      updatedById: req.user.id,
    };
    if (data.date !== undefined) patch.date = new Date(data.date);
    if (data.content !== undefined) patch.content = data.content.trim();
    if (data.category !== undefined) patch.category = data.category?.trim() || null;
    if (data.vendorId !== undefined) {
      patch.vendorId = await resolveVendorId(req.user.companyId, data.vendorId);
    }
    if (data.projectId !== undefined) {
      if (data.projectId) {
        const ok = await assertProjectInCompany(data.projectId, req.user.companyId);
        if (!ok) return res.status(404).json({ error: '연결할 프로젝트를 찾을 수 없습니다' });
        patch.projectId = data.projectId;
        patch.companyWide = true;
      } else {
        patch.projectId = null;
        patch.companyWide = false;
      }
    }
    if (data.assigneeId !== undefined) {
      if (data.assigneeId) {
        const ok = await assertMemberOfCompany(data.assigneeId, req.user.companyId);
        if (!ok) return res.status(404).json({ error: '담당자를 찾을 수 없습니다' });
        patch.assigneeId = data.assigneeId;
      } else {
        patch.assigneeId = null;
      }
    }
    if (data.isPrivate !== undefined) patch.isPrivate = !!data.isPrivate;

    const updated = await prisma.dailyScheduleEntry.update({
      where: { id: req.params.id },
      data: patch,
      include: {
        project: { select: { id: true, name: true } },
        vendor: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, nickname: true } },
      },
    });
    res.json({ entry: updated });
  } catch (e) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    next(e);
  }
});

// ============================================
// DELETE /api/company-schedules/:id
// ============================================
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await findOwned(req.params.id, req.user.id, req.user.companyId);
    if (!existing) return res.status(404).json({ error: 'Entry not found' });
    await prisma.dailyScheduleEntry.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
