// 홈 대시보드 — 앞으로 3일 안에 해야 할 일 (역할 기반 노출).
//
// 시간 창: [today-∞, today+3]. 지남 항목은 계속 노출(긴급도 최상).
//
// 역할 노출 (team):
//   - FIELD : 현장 업무(공종 일정) + 발주 체크리스트 + PO  → team ∈ {FIELD, BOTH}
//   - DESIGN: 마감재 미확정 + 발주 체크리스트 + PO        → team ∈ {DESIGN, BOTH}
//   - OWNER : 모두
//
// 항목 종류와 team 매핑:
//   1. DailyScheduleEntry(category 있음) within window         → FIELD
//   2. PurchaseOrder PENDING within window or overdue           → BOTH (= 발주)
//   3. Material status IN (UNDECIDED,REVIEWING) — 곧 시공 시작/진행중 프로젝트만 → DESIGN
//   4. ProjectChecklist dueDate within window:
//        - phase='발주' OR title에 발주/자재/주문/매입/배송 키워드 → BOTH
//        - phase='마감재' OR title에 마감재/샘플/모델/시안 키워드 → DESIGN
//        - 그 외 → FIELD
//
const express = require('express');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function endOfDay(d) { const x = new Date(d); x.setHours(23, 59, 59, 999); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function daysBetween(a, b) { return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); }

// 사용자 역할이 항목 team을 볼 수 있는지.
// team 값:
//   FIELD  → 현장팀에만
//   DESIGN → 디자인팀에만
//   ORDER  → 양쪽 모두 (발주는 둘 다 챙겨야 함)
//   BOTH   → 양쪽 모두 (PO·프로젝트 알람용 별칭)
//   OTHER  → 카드 미노출
function canSeeTeam(role, team) {
  if (team === 'OTHER') return false;
  if (role === 'OWNER') return true;
  if (role === 'FIELD') return team === 'FIELD' || team === 'ORDER' || team === 'BOTH';
  if (role === 'DESIGNER') return team === 'DESIGN' || team === 'ORDER' || team === 'BOTH';
  return true;
}

function dayLabelFromDiff(diff, fallback) {
  if (diff < 0) return `${Math.abs(diff)}일 지남`;
  if (diff === 0) return '오늘';
  return `D-${diff}`;
}

function levelFromDiff(diff) {
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff <= 1) return 'soon';
  return 'soon';
}

// GET /api/dashboard/today-actions
router.get('/today-actions', async (req, res, next) => {
  try {
    const companyId = req.user.companyId;
    const role = req.user.role;
    if (!companyId) return res.json({ items: [] });

    const today = startOfDay(new Date());
    const horizonEnd = endOfDay(addDays(today, 3));     // today+3 까지
    const projectStartHorizon = endOfDay(addDays(today, 14)); // 마감재용 보조 창

    const projects = await prisma.project.findMany({
      where: { companyId },
      select: { id: true, name: true, startDate: true, status: true },
    });
    if (projects.length === 0) return res.json({ items: [] });

    const projectIds = projects.map((p) => p.id);
    const projectById = new Map(projects.map((p) => [p.id, p]));

    // 마감재 표시 대상 프로젝트 — 진행중이거나 14일내 시공 시작
    const materialProjectIds = projects
      .filter((p) => p.status === 'IN_PROGRESS' ||
        (p.status === 'PLANNED' && p.startDate && new Date(p.startDate) <= projectStartHorizon))
      .map((p) => p.id);

    const [schedules, orders, materials, checklists] = await Promise.all([
      // 1. 현장 일정 — category 있는 항목, 3일 내
      prisma.dailyScheduleEntry.findMany({
        where: {
          projectId: { in: projectIds },
          category: { not: null },
          date: { gte: today, lte: horizonEnd },
        },
        select: { id: true, projectId: true, date: true, category: true, content: true, confirmed: true },
        orderBy: { date: 'asc' },
        take: 50,
      }),
      // 2. PO PENDING — 지남 + 3일 내
      prisma.purchaseOrder.findMany({
        where: {
          projectId: { in: projectIds },
          status: 'PENDING',
          expectedDate: { not: null, lte: horizonEnd },
        },
        select: { id: true, projectId: true, itemName: true, vendor: true, expectedDate: true },
        orderBy: { expectedDate: 'asc' },
        take: 50,
      }),
      // 3. 마감재 미확정 — 곧 시공 시작/진행중 프로젝트만
      materialProjectIds.length > 0
        ? prisma.material.findMany({
            where: {
              projectId: { in: materialProjectIds },
              status: { in: ['UNDECIDED', 'REVIEWING'] },
            },
            select: { id: true, projectId: true, spaceGroup: true, itemName: true, status: true },
            take: 50,
          })
        : Promise.resolve([]),
      // 4. 체크리스트 — 3일 내 마감, 미완료, team='OTHER' 제외
      prisma.projectChecklist.findMany({
        where: {
          projectId: { in: projectIds },
          isDone: false,
          dueDate: { not: null, lte: horizonEnd },
          team: { not: 'OTHER' },
        },
        select: { id: true, projectId: true, title: true, phase: true, team: true, dueDate: true },
        orderBy: { dueDate: 'asc' },
        take: 100,
      }),
    ]);

    const items = [];

    // 1. 현장 일정
    for (const s of schedules) {
      const proj = projectById.get(s.projectId);
      if (!proj) continue;
      const diff = daysBetween(today, s.date);
      if (diff < 0) continue; // schedule은 과거를 끌어오지 않음
      const team = 'FIELD';
      if (!canSeeTeam(role, team)) continue;
      items.push({
        id: `sch-${s.id}`,
        level: diff === 0 ? 'today' : 'soon',
        dayLabel: dayLabelFromDiff(diff),
        kind: 'schedule',
        team,
        title: `${proj.name} · ${s.content}`,
        meta: `현장 ${s.category}`,
        href: `/projects/${s.projectId}/schedule`,
        sortKey: diff * 10 + 1,
      });
    }

    // 2. PO PENDING
    for (const o of orders) {
      const proj = projectById.get(o.projectId);
      if (!proj) continue;
      const diff = daysBetween(today, o.expectedDate);
      const team = 'BOTH';
      if (!canSeeTeam(role, team)) continue;
      const metaParts = ['발주 대기'];
      if (o.vendor) metaParts.push(o.vendor);
      items.push({
        id: `po-${o.id}`,
        level: levelFromDiff(diff),
        dayLabel: dayLabelFromDiff(diff),
        kind: 'order',
        team,
        title: `${proj.name} · ${o.itemName}`,
        meta: metaParts.join(' · '),
        href: `/projects/${o.projectId}/orders`,
        sortKey: diff * 10 + 2,
      });
    }

    // 3. 마감재 미확정 (날짜 단위 정렬 아님 — 가장 우선순위 낮은 묶음)
    for (const m of materials) {
      const proj = projectById.get(m.projectId);
      if (!proj) continue;
      const team = 'DESIGN';
      if (!canSeeTeam(role, team)) continue;
      // 마감재 자체는 dueDate가 없으니 프로젝트 시공일까지 남은 일수로 정렬
      const projDiff = proj.startDate ? daysBetween(today, proj.startDate) : 999;
      const label = projDiff <= 0
        ? '마감재 미확정'
        : `시공 D-${projDiff}`;
      items.push({
        id: `mat-${m.id}`,
        level: projDiff <= 3 ? 'today' : 'review',
        dayLabel: label,
        kind: 'material',
        team,
        title: `${proj.name} · ${m.spaceGroup}${m.itemName ? ` · ${m.itemName}` : ''}`,
        meta: '마감재 확정 필요',
        href: `/projects/${m.projectId}/materials`,
        sortKey: 1000 + projDiff,
      });
    }

    // 4. 체크리스트 — team 필드 직접 사용 (자동 추론은 생성 시 적용됨)
    const TEAM_TAG = { FIELD: '현장', DESIGN: '마감재', ORDER: '발주' };
    for (const c of checklists) {
      const proj = projectById.get(c.projectId);
      if (!proj) continue;
      if (!canSeeTeam(role, c.team)) continue;
      const diff = daysBetween(today, c.dueDate);
      items.push({
        id: `chk-${c.id}`,
        level: levelFromDiff(diff),
        dayLabel: dayLabelFromDiff(diff),
        kind: 'checklist',
        team: c.team,
        title: `${proj.name} · ${c.title}`,
        meta: TEAM_TAG[c.team] || '체크리스트',
        href: `/projects/${c.projectId}/checklist`,
        sortKey: diff * 10 + 3,
      });
    }

    // 정렬: level 우선 → sortKey
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
