// 데모 계정 날짜 자동 refresh — 데모 회사의 메인 프로젝트 일정·체크리스트·발주·견적 날짜를
// "오늘 ± N일" 범위로 항상 유지. 봉기님 결정 (2026-05-17): 시연 시 노출되는 화면이 항상 진행 중처럼 보이도록.
//
// 동작:
//   1. 회사명 "수플렉스 데모 인테리어" 찾기
//   2. siteCode='DEMO_PROJECT_FROM_REAL' 프로젝트 찾기
//   3. project.startDate 와 (오늘 + DEMO_START_OFFSET_DAYS) 차이 계산
//   4. 차이 = 0이면 skip (이미 최신)
//   5. 차이만큼 모든 날짜 필드 일괄 shift + status=IN_PROGRESS + actualEndDate=null 보장
//
// 호출:
//   - 서버 부팅 시 server.js 가 자동 호출 (매 부팅마다 idempotent)
//   - 수동 1줄: node scripts/refresh-demo-dates.js
//
// 데모 회사 외 다른 회사 데이터에는 절대 영향 없음 — companyId 매칭 강제.

const DEMO_COMPANY_NAME = '수플렉스 데모 인테리어';
const DEMO_SITE_CODE = 'DEMO_PROJECT_FROM_REAL';
const DEMO_START_OFFSET_DAYS = -5; // 데모 startDate = 오늘 - 5일

function startOfDay(d) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function shift(d, offsetDays) {
  if (!d) return null;
  return addDays(new Date(d), offsetDays);
}

async function refreshDemoDates(prisma) {
  const co = await prisma.company.findFirst({
    where: { name: DEMO_COMPANY_NAME },
    select: { id: true },
  });
  if (!co) return { applied: false, reason: 'no-demo-company' };

  const project = await prisma.project.findFirst({
    where: { companyId: co.id, siteCode: DEMO_SITE_CODE },
    select: { id: true, startDate: true, expectedEndDate: true, status: true },
  });
  if (!project || !project.startDate) return { applied: false, reason: 'no-demo-project' };

  const today = startOfDay(new Date());
  const target = addDays(today, DEMO_START_OFFSET_DAYS);
  const offsetDays = Math.floor((target - startOfDay(project.startDate)) / 86400000);

  // 오늘에 이미 맞춰져 있고 status도 IN_PROGRESS면 skip
  if (offsetDays === 0 && project.status === 'IN_PROGRESS') {
    return { applied: false, reason: 'already-fresh', offsetDays: 0 };
  }

  // 1) 프로젝트 본체
  await prisma.project.update({
    where: { id: project.id },
    data: {
      startDate: shift(project.startDate, offsetDays),
      expectedEndDate: project.expectedEndDate ? shift(project.expectedEndDate, offsetDays) : null,
      actualEndDate: null,
      status: 'IN_PROGRESS',
    },
  });

  const counts = { schedules: 0, orders: 0, checklists: 0, quotes: 0 };

  // 2) 일정 entries
  if (offsetDays !== 0) {
    const schedules = await prisma.dailyScheduleEntry.findMany({
      where: { projectId: project.id },
      select: { id: true, date: true },
    });
    for (const e of schedules) {
      await prisma.dailyScheduleEntry.update({
        where: { id: e.id },
        data: { date: shift(e.date, offsetDays) },
      });
    }
    counts.schedules = schedules.length;

    // 3) 발주
    const orders = await prisma.purchaseOrder.findMany({
      where: { projectId: project.id },
      select: { id: true, expectedDate: true, orderedAt: true, receivedAt: true, materialChangedAt: true },
    });
    for (const o of orders) {
      await prisma.purchaseOrder.update({
        where: { id: o.id },
        data: {
          expectedDate: shift(o.expectedDate, offsetDays),
          orderedAt: shift(o.orderedAt, offsetDays),
          receivedAt: shift(o.receivedAt, offsetDays),
          materialChangedAt: shift(o.materialChangedAt, offsetDays),
        },
      });
    }
    counts.orders = orders.length;

    // 4) 체크리스트
    const checklists = await prisma.projectChecklist.findMany({
      where: { projectId: project.id },
      select: { id: true, dueDate: true, completedAt: true },
    });
    for (const c of checklists) {
      await prisma.projectChecklist.update({
        where: { id: c.id },
        data: {
          dueDate: shift(c.dueDate, offsetDays),
          completedAt: shift(c.completedAt, offsetDays),
        },
      });
    }
    counts.checklists = checklists.length;

    // 5) 간편 견적
    const quotes = await prisma.simpleQuote.findMany({
      where: { projectId: project.id },
      select: { id: true, quoteDate: true, sentAt: true, acceptedAt: true },
    });
    for (const q of quotes) {
      await prisma.simpleQuote.update({
        where: { id: q.id },
        data: {
          quoteDate: shift(q.quoteDate, offsetDays),
          sentAt: shift(q.sentAt, offsetDays),
          acceptedAt: shift(q.acceptedAt, offsetDays),
        },
      });
    }
    counts.quotes = quotes.length;
  }

  return { applied: true, offsetDays, counts };
}

module.exports = { refreshDemoDates };
