// 홈 대시보드 — 오늘 할 일 통합 조회 (결정론 규칙)
// 규칙(우선순위 순):
//   1. 체크리스트 기한 지남 (isDone=false, dueDate<today)              → overdue
//   2. PO expectedDate < today (PENDING)                              → overdue
//   3. 시공 startDate ≤ today+7 인데 PENDING PO 존재 (status=PLANNED)  → overdue
//   4. 체크리스트 오늘 마감 (dueDate=today, isDone=false)              → today
//   5. PO expectedDate = today (PENDING)                              → today
//   6. 체크리스트 D-1 (dueDate=today+1, isDone=false)                  → soon
//   7. PO expectedDate ∈ (today+1, today+2] (PENDING)                 → soon
//   8. 견적 5일+ 묵힘 (SimpleQuote.status=DRAFT, updatedAt < today-5)  → review
//
// 모든 항목은 회사 스코프(companyId)로 필터.
const express = require('express');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function daysBetween(a, b) {
  // 일자 단위 차이 (a→b). 같은 날 = 0
  return Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
}

// GET /api/dashboard/today-actions
// 응답: { items: [{ id, level, dayLabel, kind, title, meta, href }] }
router.get('/today-actions', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.json({ items: [] });

    const today = startOfDay(new Date());
    const todayEnd = endOfDay(today);
    const tomorrow = addDays(today, 1);
    const dayAfter = addDays(today, 2);
    const sevenDays = endOfDay(addDays(today, 7));
    const fiveDaysAgo = addDays(today, -5);

    // 회사 프로젝트 ID들
    const projects = await prisma.project.findMany({
      where: { companyId },
      select: { id: true, name: true, startDate: true, status: true },
    });
    const projectIds = projects.map((p) => p.id);
    const projectById = new Map(projects.map((p) => [p.id, p]));

    if (projectIds.length === 0) return res.json({ items: [] });

    // 병렬 쿼리
    const [checklists, orders, quotes, pendingOrdersByProject] = await Promise.all([
      // 1·4·6: 체크리스트 (지남·오늘·D-1)
      prisma.projectChecklist.findMany({
        where: {
          projectId: { in: projectIds },
          isDone: false,
          dueDate: { not: null, lte: endOfDay(tomorrow) },
        },
        select: {
          id: true, title: true, dueDate: true, projectId: true,
        },
        orderBy: { dueDate: 'asc' },
      }),
      // 2·5·7: PO (지남·오늘·D-1·D-2)
      prisma.purchaseOrder.findMany({
        where: {
          projectId: { in: projectIds },
          status: 'PENDING',
          expectedDate: { not: null, lte: endOfDay(dayAfter) },
        },
        select: {
          id: true, itemName: true, vendor: true, expectedDate: true, projectId: true,
        },
        orderBy: { expectedDate: 'asc' },
      }),
      // 8: 견적 묵힘
      prisma.simpleQuote.findMany({
        where: {
          projectId: { in: projectIds },
          status: 'DRAFT',
          updatedAt: { lt: fiveDaysAgo },
        },
        select: {
          id: true, title: true, updatedAt: true, projectId: true,
        },
        orderBy: { updatedAt: 'asc' },
        take: 20,
      }),
      // 3 (보조): 프로젝트별 PENDING PO 갯수
      prisma.purchaseOrder.groupBy({
        by: ['projectId'],
        where: {
          projectId: { in: projectIds },
          status: 'PENDING',
        },
        _count: { id: true },
      }),
    ]);
    const pendingPoMap = new Map(pendingOrdersByProject.map((g) => [g.projectId, g._count.id]));

    const items = [];

    // 1·4·6: 체크리스트
    for (const c of checklists) {
      const proj = projectById.get(c.projectId);
      if (!proj) continue;
      const diff = daysBetween(today, c.dueDate);
      let level, dayLabel;
      if (diff < 0) { level = 'overdue'; dayLabel = `${Math.abs(diff)}일 지남`; }
      else if (diff === 0) { level = 'today'; dayLabel = '오늘'; }
      else { level = 'soon'; dayLabel = 'D-1'; }
      items.push({
        id: `chk-${c.id}`,
        level,
        dayLabel,
        kind: 'checklist',
        title: `${proj.name} · ${c.title}`,
        meta: '체크리스트',
        href: `/projects/${c.projectId}/checklist`,
        sortKey: diff,
      });
    }

    // 2·5·7: PO
    for (const o of orders) {
      const proj = projectById.get(o.projectId);
      if (!proj) continue;
      const diff = daysBetween(today, o.expectedDate);
      let level, dayLabel;
      if (diff < 0) { level = 'overdue'; dayLabel = `${Math.abs(diff)}일 지남`; }
      else if (diff === 0) { level = 'today'; dayLabel = '오늘 발주'; }
      else if (diff === 1) { level = 'soon'; dayLabel = 'D-1'; }
      else { level = 'soon'; dayLabel = `D-${diff}`; }
      const metaParts = ['발주 대기'];
      if (o.vendor) metaParts.push(o.vendor);
      items.push({
        id: `po-${o.id}`,
        level,
        dayLabel,
        kind: 'order',
        title: `${proj.name} · ${o.itemName}`,
        meta: metaParts.join(' · '),
        href: `/projects/${o.projectId}/orders`,
        sortKey: diff,
      });
    }

    // 3: 시공 D-7 + 자재 미발주 (검토)
    for (const p of projects) {
      if (!p.startDate) continue;
      if (p.status !== 'PLANNED' && p.status !== 'IN_PROGRESS') continue;
      const diff = daysBetween(today, p.startDate);
      if (diff < 0 || diff > 7) continue;
      const pendingCount = pendingPoMap.get(p.id) || 0;
      if (pendingCount === 0) continue;
      items.push({
        id: `proj-prep-${p.id}`,
        level: 'review',
        dayLabel: '검토',
        kind: 'project',
        title: `${p.name} · 시공 임박`,
        meta: `D-${diff}, 발주 대기 ${pendingCount}건`,
        href: `/projects/${p.id}/orders`,
        sortKey: 100 + diff, // 검토는 뒤로
      });
    }

    // 8: 견적 묵힘
    for (const q of quotes) {
      const proj = projectById.get(q.projectId);
      if (!proj) continue;
      const stale = daysBetween(q.updatedAt, today);
      items.push({
        id: `sq-${q.id}`,
        level: 'review',
        dayLabel: '검토',
        kind: 'quote',
        title: `${proj.name} · ${q.title}`,
        meta: `견적 작성 ${stale}일째 진행 중`,
        href: `/projects/${q.projectId}/quotes`,
        sortKey: 200 - stale, // 오래 묵힐수록 앞
      });
    }

    // 레벨 우선순위 + sortKey
    const levelRank = { overdue: 0, today: 1, soon: 2, review: 3 };
    items.sort((a, b) => {
      const lr = levelRank[a.level] - levelRank[b.level];
      if (lr !== 0) return lr;
      return a.sortKey - b.sortKey;
    });
    items.forEach((it) => { delete it.sortKey; });

    res.json({ items });
  } catch (e) { next(e); }
});

module.exports = router;
