// 일정의 phase(category)가 시작될 때 회사 ChecklistTemplate에서 자동으로
// ProjectChecklist를 생성. sourceTemplateId로 중복 방지.

async function syncChecklistFromPhase(tx, { projectId, companyId, phase, userId }) {
  if (!phase) return { created: 0 };

  const templates = await tx.checklistTemplate.findMany({
    where: { companyId, phase, active: true },
    orderBy: { orderIndex: 'asc' },
  });
  if (templates.length === 0) return { created: 0 };

  const existing = await tx.projectChecklist.findMany({
    where: { projectId, sourceTemplateId: { in: templates.map((t) => t.id) } },
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

module.exports = { syncChecklistFromPhase, addChecklistFromTemplateIds };
