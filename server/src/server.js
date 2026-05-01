const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');
const { seedLoungeTags } = require('./services/lounge');

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`[suplex] API listening on port ${env.port}`);
  console.log(`[suplex] env: ${env.nodeEnv}`);
  // 라운지 태그 화이트리스트 멱등 시드 (실패해도 서비스 동작에 영향 X)
  seedLoungeTags(prisma)
    .then((n) => console.log(`[suplex] lounge tags seeded: ${n}`))
    .catch((e) => console.error('[suplex] seedLoungeTags failed:', e.message));
});

process.on('SIGINT', () => {
  console.log('\n[suplex] shutting down...');
  server.close(() => process.exit(0));
});
