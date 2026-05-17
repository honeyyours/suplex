// 데모 계정 날짜 수동 refresh — 데모 회사 한정.
// 사용: railway run --service suplex node scripts/refresh-demo-dates.js
//
// 서버 부팅 시 자동 실행되지만, 봉기님이 시연 직전 즉시 갱신하고 싶을 때 1줄로.

const prisma = require('../src/config/prisma');
const { refreshDemoDates } = require('../src/services/demoDateRefresh');

async function main() {
  const r = await refreshDemoDates(prisma);
  if (r.applied) {
    console.log(`✓ 데모 날짜 refresh 완료 (offset=${r.offsetDays}일)`);
    console.log(`  일정 ${r.counts.schedules} · 발주 ${r.counts.orders} · 체크리스트 ${r.counts.checklists} · 견적 ${r.counts.quotes}`);
  } else {
    console.log(`· skip (${r.reason})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
