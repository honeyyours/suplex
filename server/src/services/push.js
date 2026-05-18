// Web Push 발송 서비스 — web-push 라이브러리 기반.
// VAPID 키 미설정 시 isConfigured=false → 호출부에서 no-op 처리.
// 발송 실패(410 Gone, 404 Not Found) 시 해당 구독 자동 삭제.

const webpush = require('web-push');
const env = require('../config/env');
const prisma = require('../config/prisma');

let initialized = false;
function ensureInit() {
  if (initialized) return;
  if (!env.vapid.publicKey || !env.vapid.privateKey) return;
  webpush.setVapidDetails(env.vapid.subject, env.vapid.publicKey, env.vapid.privateKey);
  initialized = true;
}

function isConfigured() {
  return !!(env.vapid.publicKey && env.vapid.privateKey);
}

// 단일 구독에 페이로드 전송. 실패 시 구독 삭제 + null 반환.
async function sendToSubscription(sub, payload) {
  ensureInit();
  if (!isConfigured()) return { ok: false, skipped: true };
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60 } // 1시간 — 폰이 오프라인이어도 1시간 안에 도달하면 표시
    );
    // lastSeenAt 갱신 (실패 누적 정리 기준)
    await prisma.pushSubscription.update({
      where: { id: sub.id },
      data: { lastSeenAt: new Date() },
    }).catch(() => {});
    return { ok: true };
  } catch (e) {
    const status = e.statusCode;
    // 410 Gone, 404 Not Found = 구독 만료. DB에서 삭제.
    if (status === 410 || status === 404) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      return { ok: false, removed: true, status };
    }
    console.error('[push] 발송 실패:', status, e.body || e.message);
    return { ok: false, status, error: e.message };
  }
}

// 사용자 전체 기기에 발송 — 여러 기기 구독 시 모두 발송.
// payload = { title, body, url?, tag?, icon? }
async function sendToUser(userId, payload) {
  ensureInit();
  if (!isConfigured()) return { ok: false, skipped: true, sent: 0, failed: 0 };
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return { ok: true, sent: 0, failed: 0, note: 'no_subscriptions' };
  const results = await Promise.all(subs.map((s) => sendToSubscription(s, payload)));
  const sent = results.filter((r) => r.ok).length;
  const failed = results.length - sent;
  return { ok: true, sent, failed };
}

module.exports = {
  isConfigured,
  sendToUser,
  sendToSubscription,
};
