// 일정의 phase(category)가 시작될 때 회사 ChecklistTemplate에서 자동으로
// ProjectChecklist를 생성. (templateId + dueDate) 조합으로 중복 방지 →
// 같은 공종이 여러 날짜에 진행되면 날짜별로 새 세트가 생성됨.

async function syncChecklistFromPhase(tx, { projectId, companyId, phase, dueDate, userId }) {
  if (!phase) return { created: 0 };

  const templates = await tx.checklistTemplate.findMany({
    where: { companyId, phase, active: true },
    orderBy: { orderIndex: 'asc' },
  });
  if (templates.length === 0) return { created: 0 };

  const existing = await tx.projectChecklist.findMany({
    where: {
      projectId,
      sourceTemplateId: { in: templates.map((t) => t.id) },
      dueDate: dueDate || null,
    },
    select: { sourceTemplateId: true },
  });
  const usedIds = new Set(existing.map((e) => e.sourceTemplateId));
  const toCreate = templates.filter((t) => !usedIds.has(t.id));
  if (toCreate.length === 0) return { created: 0 };

  const maxOrder = await tx.projectChecklist.aggregate({
    where: { projectId },
    _max: { orderIndex: true },
  });
  let nextOrder = (maxOrder._max.orderIndex ?? -1) + 1;

  await tx.projectChecklist.createMany({
    data: toCreate.map((t) => ({
      projectId,
      title: t.title,
      category: t.category,
      phase: t.phase,
      requiresPhoto: t.requiresPhoto,
      sourceTemplateId: t.id,
      dueDate: dueDate || null,
      orderIndex: nextOrder++,
      createdById: userId || null,
    })),
  });
  return { created: toCreate.length };
}

// 수동 가져오기 — 선택한 templateId 목록만 추가
async function addChecklistFromTemplateIds(tx, { projectId, companyId, templateIds, userId }) {
  if (!Array.isArray(templateIds) || templateIds.length === 0) return { created: 0 };

  const templates = await tx.checklistTemplate.findMany({
    where: { id: { in: templateIds }, companyId, active: true },
    orderBy: { orderIndex: 'asc' },
  });
  if (templates.length === 0) return { created: 0 };

  const existing = await tx.projectChecklist.findMany({
    where: { projectId, sourceTemplateId: { in: templates.map((t) => t.id) } },
    select: { sourceTemplateId: true },
  });
  const usedIds = new Set(existing.map((e) => e.sourceTemplateId));
  const toCreate = templates.filter((t) => !usedIds.has(t.id));
  if (toCreate.length === 0) return { created: 0, skipped: templates.length };

  const maxOrder = await tx.projectChecklist.aggregate({
    where: { projectId },
    _max: { orderIndex: true },
  });
  let nextOrder = (maxOrder._max.orderIndex ?? -1) + 1;

  await tx.projectChecklist.createMany({
    data: toCreate.map((t) => ({
      projectId,
      title: t.title,
      category: t.category,
      phase: t.phase,
      requiresPhoto: t.requiresPhoto,
      sourceTemplateId: t.id,
      orderIndex: nextOrder++,
      createdById: userId || null,
    })),
  });
  return { created: toCreate.length, skipped: templates.length - toCreate.length };
}

// ============================================
// 공정 어드바이스 → 체크리스트 자동 생성
// 일정 entry 시작일에서 advice.daysBefore 차감한 날짜에 체크리스트 항목으로 추가.
// 중복 방지: (projectId + title + dueDate) 조합 기준
// ============================================
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
        category: 'GENERAL',
        phase: a.phase,
        requiresPhoto: false,
        dueDate: due,
        orderIndex: nextOrder++,
        createdById: userId || null,
      },
    });
    created++;
  }
  return { created };
}

module.exports = { syncChecklistFromPhase, addChecklistFromTemplateIds, syncAdvicesFromPhase };
