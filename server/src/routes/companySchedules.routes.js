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
// 공정(category)은 팀캘린더에서 의미 약결합·노출 제거 (봉기님 결정 옵션 c, 2026-05-17).
// 프로젝트 공정 일정은 ProjectSchedule에서만 사용. DailyScheduleEntry.category 컬럼은 그쪽에서 유지.
const createSchema = z.object({
  date: z.string(), // 단일 일정 OR 기간 일정의 시작일
  dateEnd: z.string().optional().nullable(), // 기간 일정의 종료일 (포함, 시작일 ≤ 종료일). 미지정 시 단일 일정.
  content: z.string().min(1),
  vendorId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  isPrivate: z.boolean().optional(),
});

function enumerateDays(startStr, endStr) {
  const start = new Date(startStr);
  const end = endStr ? new Date(endStr) : start;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (end < start) return [];
  const days = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  // 안전상한 60일 — 시공팀 2~3일 묶음 가정. 잘못된 큰 범위는 거부
  let guard = 0;
  while (cur <= last && guard < 60) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
    guard++;
  }
  return days;
}

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
    const days = enumerateDays(data.date, data.dateEnd || null);
    if (days.length === 0) {
      return res.status(400).json({ error: '날짜가 올바르지 않습니다 (시작 ≤ 종료, 60일 이내)' });
    }

    const baseData = {
      projectId: data.projectId || null,
      companyId: req.user.companyId,
      content: data.content.trim(),
      vendorId,
      assigneeId,
      isPrivate: !!data.isPrivate,
      companyWide: !!data.projectId,
      createdById: req.user.id,
      updatedById: req.user.id,
    };

    // 단일: 기존 동작 그대로 create 후 include 반환. 기간 N일: createMany + 첫 row 반환.
    if (days.length === 1) {
      const created = await prisma.dailyScheduleEntry.create({
        data: { ...baseData, date: days[0] },
        include: {
          project: { select: { id: true, name: true } },
          vendor: { select: { id: true, name: true } },
          assignee: { select: { id: true, name: true, nickname: true } },
        },
      });
      return res.status(201).json({ entry: created, createdCount: 1 });
    }

    await prisma.dailyScheduleEntry.createMany({
      data: days.map((d) => ({ ...baseData, date: d })),
    });
    res.status(201).json({ createdCount: days.length });
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
