// 모든 기존 프로젝트의 createdBy를 ProjectMember(LEAD)로 자동 등록.
// idempotent — 이미 있으면 skip. start 스크립트에서 매 부팅 시 실행 안전.
//
// 정책: OWNER는 ProjectMember 행이 없어도 풀권한(코드상 우회)이지만, createdBy를
// LEAD로 명시 등록해서 멤버 목록 UI에서 누가 주도 프로젝트인지 보이게 함.

const prisma = require('../src/config/prisma');

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, createdById: true },
  });

  if (projects.length === 0) {
    console.log('[seed-project-members] no projects to seed');
    return;
  }

  const rows = projects.map((p) => ({
    projectId: p.id,
    userId: p.createdById,
    role: 'LEAD',
  }));

  const result = await prisma.projectMember.createMany({
    data: rows,
    skipDuplicates: true,
  });

  console.log(`[seed-project-members] seeded ${result.count} new LEAD rows (of ${projects.length} projects)`);
}

main()
  .catch((e) => {
    console.error('[seed-project-members] failed:', e.message);
    // 실패해도 server boot은 계속 (테이블 미존재 등 마이그 직후 케이스 대비)
    process.exitCode = 0;
  })
  .finally(() => prisma.$disconnect());
