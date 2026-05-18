// 수플렉스 service worker — 최소 등록 (2026-05-17) + Web Push (2026-05-18)
// 목적: PWA installable 자격 충족 + 홈 화면 추가 + 풀스크린 standalone 모드 + 푸시 알림 수신.
// 캐싱 정책 X — stale 데이터 위험 회피. 모든 fetch는 네트워크 직진.
// 추후 정식 출시 시 워크박스·런타임 캐싱 검토 (TODO 메모리).

const VERSION = 'v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// fetch 핸들러 — 네트워크 그대로 (캐시 X). 단 핸들러 존재가 installable 조건.
self.addEventListener('fetch', (event) => {
  // 명시적으로 네트워크 fall-through. respondWith 없이 두면 기본 동작 그대로.
});

// ============================================
// Web Push — 서버에서 web-push 라이브러리로 발송한 알림을 폰에 표시.
// 페이로드 형식: { title, body, url?, tag?, icon? } JSON.
// ============================================

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: '수플렉스', body: event.data?.text() || '' };
  }
  const title = data.title || '수플렉스';
  const options = {
    body: data.body || '',
    icon: data.icon || '/suplex-logo.png',
    badge: '/suplex-logo.png',
    tag: data.tag, // 같은 tag면 이전 알림 대체 — 중복 알림 방지
    data: { url: data.url || '/' },
    requireInteraction: false,
    // 진동 패턴 명시 — Android 일부 환경에서 OS 디폴트가 진동 X 일 때 폴백.
    // 사용자 OS 알림 채널 설정이 우선이라 보장은 아님.
    vibrate: [200, 100, 200],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 알림 클릭 — 앱이 이미 열려있으면 포커스, 아니면 새 창. data.url 로 이동.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // 같은 origin 창이 있으면 그쪽으로 포커스 + 라우팅
    for (const client of allClients) {
      const url = new URL(client.url);
      if (url.origin === self.location.origin) {
        await client.focus();
        if ('navigate' in client) {
          try { await client.navigate(targetUrl); } catch {}
        }
        return;
      }
    }
    // 열린 창 없으면 새로
    await self.clients.openWindow(targetUrl);
  })());
});
