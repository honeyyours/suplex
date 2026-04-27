const express = require('express');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');

const router = express.Router();
router.use(authRequired);

// GET /api/activity?days=7&limit=30
// 회사 전체 최근 활동 통합 피드
router.get('/', async (req, res, next) => {
  try {
    const days = Math.max(1, Math.min(30, Number(req.query.days) || 7));
    const limit = Math.max(5, Math.min(100, Number(req.query.limit) || 30));

    const since = new Date();
    since.setDate(since.getDate() - days);

    const companyId = req.user.companyId;
    const projectScope = { project: { companyId } };

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { hideExpenses: true },
    });
    const hideExpenses = !!company?.hideExpenses;

    const [
      scheduleChanges,
      reports,
      expenses,
      checklistsDone,
    ] = await Promise.all([
      prisma.scheduleChange.findMany({
        where: { ...projectScope, createdAt: { gte: since } },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.dailyReport.findMany({
        where: { ...projectScope, createdAt: { gte: since } },
        include: {
          project: { select: { id: true, name: true } },
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      hideExpenses ? Promise.resolve([]) : prisma.expense.findMany({
        where: { companyId, createdAt: { gte: since } },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.projectChecklist.findMany({
        where: {
          ...projectScope,
          isDone: true,
          completedAt: { gte: since },
        },
        include: {
          project: { select: { id: true, name: true } },
          completedBy: { select: { id: true, name: true } },
        },
        orderBy: { completedAt: 'desc' },
        take: limit,
      }),
    ]);

    const ACTION_LABEL = {
      ADD: '추가',
      UPDATE: '수정',
      DELETE: '삭제',
      CONFIRM: '확정',
      UNCONFIRM: '확정해제',
    };

    const items = [
      ...scheduleChanges.map((c) => ({
        id: `sc:${c.id}`,
        kind: 'SCHEDULE',
        when: c.createdAt,
        project: c.project,
        by: c.changedByName,
        message: `일정 ${ACTION_LABEL[c.action] || c.action}: ${c.newContent || c.oldContent || ''}`,
        link: c.project ? `/projects/${c.project.id}/schedule` : null,
      })),
      ...reports.map((r) => ({
        id: `rp:${r.id}`,
        kind: 'REPORT',
        when: r.createdAt,
        project: r.project,
        by: r.author?.name,
        message: `${r.category} 보고 (진행 ${r.progress}%${r.workerCount ? `, ${r.workerCount}명` : ''})`,
        link: r.project ? `/projects/${r.project.id}/reports` : null,
      })),
      ...expenses.map((e) => ({
        id: `ex:${e.id}`,
        kind: 'EXPENSE',
        when: e.createdAt,
        project: e.project,
        by: null,
        message: `${e.type === 'INCOME' ? '매출' : e.type === 'TRANSFER' ? '이체' : '지출'} ${
          Number(e.amount).toLocaleString()
        }원${e.description ? ` · ${e.description}` : ''}`,
        link: e.project ? `/projects/${e.project.id}/expenses` : '/expenses',
      })),
      ...checklistsDone.map((c) => ({
        id: `ck:${c.id}`,
        kind: 'CHECKLIST',
        when: c.completedAt,
        project: c.project,
        by: c.completedBy?.name,
        message: `체크 완료: ${c.title}`,
        link: c.project ? `/projects/${c.project.id}/checklist` : null,
      })),
    ]
      .filter((x) => x.when)
      .sort((a, b) => new Date(b.when) - new Date(a.when))
      .slice(0, limit);

    res.json({ items, days });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
