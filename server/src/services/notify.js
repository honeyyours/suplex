// 통합 알림 발송 — 인앱(Notification DB) + Web Push 동시 발송.
// 트리거 코드(체크리스트 D-3, 일정 변경 등)는 이 헬퍼만 호출하면 됨.
// 푸시 미설정/구독 없음 = 인앱만 저장 (그래도 사용자가 다음 접속 시 벨 아이콘에서 확인 가능).

const prisma = require('../config/prisma');
const { sendToUser } = require('./push');

// 알림 종류 식별자 — 클라이언트 UI에서 카테고리·아이콘 분기에 사용.
// 새 트리거 추가 시 여기에 등록 + 클라이언트 NOTIFICATION_TYPES와 일치 유지.
const TYPES = {
  CHECKLIST_DDAY: 'CHECKLIST_DDAY', // 체크리스트 D-3 미확정 등
  SCHEDULE_CHANGE: 'SCHEDULE_CHANGE',
  MEMO_MENTION: 'MEMO_MENTION',
  QUOTE_FINALIZED: 'QUOTE_FINALIZED',
  ORDER_RESPONSE: 'ORDER_RESPONSE',
  SYSTEM: 'SYSTEM', // 테스트·시스템 공지
};

// 단일 사용자에게 통합 알림.
// payload = { type, title, body, url? }
async function notify(userId, payload) {
  if (!userId || !payload?.title) return { ok: false, error: 'invalid args' };

  // 1) DB 저장 (조회 즉시 가능)
  const row = await prisma.inAppNotification.create({
    data: {
      userId,
      type: payload.type || TYPES.SYSTEM,
      title: payload.title,
      body: payload.body || '',
      url: payload.url || null,
    },
    select: { id: true },
  });

  // 2) Web Push fan-out (실패해도 인앱은 살아있음)
  const pushResult = await sendToUser(userId, {
    title: payload.title,
    body: payload.body,
    url: payload.url,
    tag: row.id, // 같은 알림이 중복 표시되지 않도록
  }).catch((e) => ({ ok: false, error: e?.message }));

  return { ok: true, notificationId: row.id, push: pushResult };
}

// 여러 사용자 일괄. 트리거 일대다 케이스 (예: 일정 변경 → 같은 프로젝트 멤버 N명)
async function notifyMany(userIds, payload) {
  const unique = [...new Set(userIds.filter(Boolean))];
  const results = await Promise.all(unique.map((uid) => notify(uid, payload)));
  return { ok: true, count: results.length, results };
}

// 사용자의 미읽음 카운트 — 30일 범위 내. 헤더 벨 polling용.
async function unreadCount(userId) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return prisma.inAppNotification.count({
    where: { userId, isRead: false, createdAt: { gt: since } },
  });
}

module.exports = {
  TYPES,
  notify,
  notifyMany,
  unreadCount,
};
