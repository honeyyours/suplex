async function recordChange(tx, {
  projectId,
  date,
  entryId,
  action,
  oldContent,
  newContent,
  oldCategory,
  newCategory,
  userId,
  userName,
}) {
  return tx.scheduleChange.create({
    data: {
      projectId,
      date: new Date(date),
      entryId: entryId || null,
      action,
      oldContent: oldContent ?? null,
      newContent: newContent ?? null,
      oldCategory: oldCategory ?? null,
      newCategory: newCategory ?? null,
      changedById: userId,
      changedByName: userName || '알 수 없음',
    },
  });
}

module.exports = { recordChange };
