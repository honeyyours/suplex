const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');
const { seedLoungeTags, backfillLoungeMemberships } = require('./services/lounge');
const { refreshDemoDates } = require('./services/demoDateRefresh');

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`[suplex] API listening on port ${env.port}`);
  console.log(`[suplex] env: ${env.nodeEnv}`);
  // 라운지 태그 화이트리스트 멱등 시드 (실패해도 서비스 동작에 영향 X)
  seedLoungeTags(prisma)
    .then((n) => console.log(`[suplex] lounge tags seeded: ${n}`))
    .catch((e) => console.error('[suplex] seedLoungeTags failed:', e.message));
  // 라운지 멤버십 멱등 백필 — 회사 승인 무관 (2026-05-14 정책 변경: 미승인 회사도 라운지 OK)
  backfillLoungeMemberships(prisma)
    .then(({ scanned, granted }) => console.log(`[suplex] lounge memberships backfilled: ${granted}/${scanned}`))
    .catch((e) => console.error('[suplex] backfillLoungeMemberships failed:', e.message));
  // 데모 계정 날짜 자동 refresh — 데모 회사 한정. 데모 없으면 skip (안전)
  refreshDemoDates(prisma)
    .then((r) => {
      if (r.applied) console.log(`[suplex] demo dates refreshed: shifted ${r.offsetDays}d (${JSON.stringify(r.counts)})`);
    })
    .catch((e) => console.error('[suplex] refreshDemoDates failed:', e.message));
});

process.on('SIGINT', () => {
  console.log('\n[suplex] shutting down...');
  server.close(() => process.exit(0));
});
