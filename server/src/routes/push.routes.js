// Web Push 구독 관리 라우트.
// GET  /push/vapid-public-key — 클라이언트가 PushManager.subscribe 에 사용할 공개키 제공
// POST /push/subscribe        — 구독 등록 (upsert)
// POST /push/unsubscribe      — 구독 해제 (endpoint 기준)
// POST /push/test             — 본인에게 테스트 알림 발송 (개발·UI 검증용)

const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const env = require('../config/env');
const { authRequired } = require('../middlewares/auth');
const { sendToUser, isConfigured } = require('../services/push');

const router = express.Router();

// 공개키 제공 — 클라이언트가 base64url → Uint8Array 변환해 PushManager.subscribe applicationServerKey 로 사용
router.get('/vapid-public-key', (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Push 알림이 비활성화되어 있습니다 (VAPID 미설정)' });
  }
  res.json({ publicKey: env.vapid.publicKey });
});

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

router.post('/subscribe', authRequired, async (req, res, next) => {
  try {
    if (!isConfigured()) return res.status(503).json({ error: 'Push 알림이 비활성화되어 있습니다' });
    const data = subscribeSchema.parse(req.body);
    const userAgent = (req.headers['user-agent'] || '').slice(0, 500);

    // 같은 endpoint 재구독 시 userId 갱신 (기기 양도 가능성). 새 endpoint면 신규.
    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint: data.endpoint },
      create: {
        userId: req.user.id,
        endpoint: data.endpoint,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent,
      },
      update: {
        userId: req.user.id,
        p256dh: data.keys.p256dh,
        auth: data.keys.auth,
        userAgent,
        lastSeenAt: new Date(),
      },
      select: { id: true },
    });
    res.json({ ok: true, id: sub.id });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: '잘못된 구독 정보' });
    next(e);
  }
});

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

router.post('/unsubscribe', authRequired, async (req, res, next) => {
  try {
    const data = unsubscribeSchema.parse(req.body);
    // 본인 구독만 삭제 가능
    await prisma.pushSubscription.deleteMany({
      where: { endpoint: data.endpoint, userId: req.user.id },
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.name === 'ZodError') return res.status(400).json({ error: '잘못된 요청' });
    next(e);
  }
});

// 본인에게 테스트 알림 — 권한 동의 후 실제 알림 오는지 확인용
router.post('/test', authRequired, async (req, res, next) => {
  try {
    if (!isConfigured()) return res.status(503).json({ error: 'Push 알림이 비활성화되어 있습니다' });
    const result = await sendToUser(req.user.id, {
      title: '수플렉스 테스트 알림',
      body: '알림이 정상적으로 도착했습니다.',
      url: '/',
      tag: 'test',
    });
    res.json(result);
  } catch (e) { next(e); }
});

// 본인 구독 목록 조회 — Settings UI 에서 "이 기기 알림 ON/OFF" 표시
router.get('/subscriptions', authRequired, async (req, res, next) => {
  try {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId: req.user.id },
      select: { id: true, endpoint: true, userAgent: true, createdAt: true, lastSeenAt: true },
      orderBy: { lastSeenAt: 'desc' },
    });
    res.json({ subscriptions: subs });
  } catch (e) { next(e); }
});

module.exports = router;
