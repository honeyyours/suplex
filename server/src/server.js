const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.port, '0.0.0.0', () => {
  console.log(`[splex] API listening on port ${env.port}`);
  console.log(`[splex] env: ${env.nodeEnv}`);
});

process.on('SIGINT', () => {
  console.log('\n[splex] shutting down...');
  server.close(() => process.exit(0));
});
