// 일정의 phase(category) 시작 시 회사 PhaseAdvice에서 자동으로 ProjectChecklist 생성.
// (중복 방지: projectId + title + dueDate 조합 기준)
//
// 2026-04-26 — ChecklistTemplate 폐기. PhaseAdvice 단일 시스템으로 통합.
// PhaseAdvice.daysBefore=0 + requiresPhoto=true 가 옛 ChecklistTemplate 역할.
// PhaseAdvice.daysBefore>0 + requiresPhoto=false 가 옛 PhaseAdvice 역할.

async function syncAdvicesFromPhase(tx, { projectId, companyId, phase, scheduleDate, userId }) {
  if (!phase || !scheduleDate) return { created: 0 };

  const advices = await tx.phaseAdvice.findMany({
    where: { companyId, phase, active: true },
  });
  if (advices.length === 0) return { created: 0 };

  let nextOrder = ((await tx.projectChecklist.aggregate({
    where: { projectId },
    _max: { orderIndex: true },
  }))._max.orderIndex ?? -1) + 1;

  let created = 0;
  for (const a of advices) {
    const due = new Date(scheduleDate);
    due.setDate(due.getDate() - a.daysBefore);
    due.setHours(0, 0, 0, 0);

    const existing = await tx.projectChecklist.findFirst({
      where: { projectId, title: a.title, dueDate: due },
    });
    if (existing) continue;

    await tx.projectChecklist.create({
      data: {
        projectId,
        title: a.title,
        category: 'GENERAL', // ChecklistCategory enum — advice.category(자유 텍스트)는 별도로 ProjectChecklist에 표시 X
        phase: a.phase,
        requiresPhoto: a.requiresPhoto || false,
        dueDate: due,
        orderIndex: nextOrder++,
        createdById: userId || null,
      },
    });
    created++;
  }
  return { created };
}

module.exports = { syncAdvicesFromPhase };
