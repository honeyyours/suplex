// 인앱 알림 센터 — 헤더 벨 아이콘 + /notifications 페이지에서 사용.
// 30일 범위 자동 필터링 (조회 쿼리에 createdAt > now-30d). cron 정리 불필요.
// 모든 라우트는 authRequired + 본인 알림만 접근.

const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { authRequired } = require('../middlewares/auth');
const { unreadCount } = require('../services/notify');

const router = express.Router();

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// GET /notifications — 본인 알림 최근 30일, 최신순
router.get('/', authRequired, async (req, res, next) => {
  try {
    const since = new Date(Date.now() - THIRTY_DAYS_MS);
    const items = await prisma.inAppNotification.findMany({
      where: { userId: req.user.id, createdAt: { gt: since } },
      orderBy: { createdAt: 'desc' },
      take: 100, // 30일 안에 100개 넘어가는 경우는 거의 없음
    });
    res.json({ items });
  } catch (e) { next(e); }
});

// GET /notifications/unread-count — 헤더 벨 polling 용 (가벼움)
router.get('/unread-count', authRequired, async (req, res, next) => {
  try {
    const count = await unreadCount(req.user.id);
    res.json({ count });
  } catch (e) { next(e); }
});

// PATCH /notifications/:id/read — 단건 읽음 처리
router.patch('/:id/read', authRequired, async (req, res, next) => {
  try {
    const row = await prisma.inAppNotification.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true },
    });
    if (!row || row.userId !== req.user.id) return res.status(404).json({ error: '알림을 찾을 수 없습니다' });
    if (row.userId !== req.user.id) return res.status(403).json({ error: '권한 없음' });
    await prisma.inAppNotification.update({
      where: { id: row.id },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// POST /notifications/read-all — 본인 모든 미읽음 일괄 읽음 처리
router.post('/read-all', authRequired, async (req, res, next) => {
  try {
    const result = await prisma.inAppNotification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ ok: true, count: result.count });
  } catch (e) { next(e); }
});

// DELETE /notifications/:id — 단건 삭제
router.delete('/:id', authRequired, async (req, res, next) => {
  try {
    const result = await prisma.inAppNotification.deleteMany({
      where: { id: req.params.id, userId: req.user.id }, // 본인 것만
    });
    if (result.count === 0) return res.status(404).json({ error: '알림을 찾을 수 없습니다' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
