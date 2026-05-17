// 수플렉스 service worker — 최소 등록 (2026-05-17)
// 목적: PWA installable 자격 충족 + 홈 화면 추가 + 풀스크린 standalone 모드.
// 캐싱 정책 X — stale 데이터 위험 회피. 모든 fetch는 네트워크 직진.
// 추후 정식 출시 시 워크박스·런타임 캐싱 검토 (TODO 메모리).

const VERSION = 'v1';

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
