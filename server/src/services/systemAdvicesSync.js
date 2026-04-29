// 시스템 룰(PhaseAdvice.ruleType='UNCONFIRMED_CHECK') lazy 동기화.
// 체크리스트 진입 시 호출 — 오늘로부터 룰의 daysBefore 일 후에 시작하는 일정 중
// confirmed=false 항목마다 체크리스트 항목을 1개 보장(중복 방지: linkedScheduleId + 룰 식별).
//
// 룰 식별은 체크리스트 title 에 룰 id 가 보이지 않게 하기 위해
// (projectId, linkedScheduleId, title) 조합으로 중복 방지한다.

const SYSTEM_PHASE_LABEL = '시스템';

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

// 한 프로젝트에 대해 회사의 시스템 룰을 적용 — 누락된 미확정 체크리스트를 INSERT.
async function syncSystemAdvicesForProject(prisma, { projectId, companyId, userId, today = new Date() }) {
  const rules = await prisma.phaseAdvice.findMany({
    where: { companyId, ruleType: 'UNCONFIRMED_CHECK', active: true },
  });
  if (rules.length === 0) return { created: 0 };

  // 다음 orderIndex 시작점
  let nextOrder = ((await prisma.projectChecklist.aggregate({
    where: { projectId },
    _max: { orderIndex: true },
  }))._max.orderIndex ?? -1) + 1;

  const todayStart = startOfDay(today);
  let created = 0;

  for (const rule of rules) {
    // 오늘로부터 daysBefore 일 후 (= 일정 시작일이 그 날)
    const target = new Date(todayStart);
    target.setDate(target.getDate() + rule.daysBefore);

    // 해당 일자에 시작하는 미확정 일정
    const entries = await prisma.dailyScheduleEntry.findMany({
      where: {
        projectId,
        date: { gte: startOfDay(target), lte: endOfDay(target) },
        confirmed: false,
      },
      select: { id: true, content: true, category: true },
    });
    if (entries.length === 0) continue;

    for (const e of entries) {
      // 이미 같은 일정에 같은 룰로 만든 항목이 있으면 스킵
      const existing = await prisma.projectChecklist.findFirst({
        where: { projectId, linkedScheduleId: e.id, title: rule.title },
        select: { id: true },
      });
      if (existing) continue;

      await prisma.projectChecklist.create({
        data: {
          projectId,
          title: rule.title,
          category: 'GENERAL',
          phase: SYSTEM_PHASE_LABEL,
          requiresPhoto: rule.requiresPhoto || false,
          dueDate: todayStart, // 미확정 점검 자체는 오늘 처리해야 할 일
          linkedScheduleId: e.id,
          orderIndex: nextOrder++,
          createdById: userId || null,
        },
      });
      created++;
    }
  }

  return { created };
}

module.exports = { syncSystemAdvicesForProject, SYSTEM_PHASE_LABEL };
