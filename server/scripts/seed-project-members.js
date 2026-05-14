// 프로젝트 멤버 백필 — 매 부팅 시 idempotent 실행.
//
// 정책 (2026-05-14): 회사 모든 직원이 디폴트로 모든 프로젝트의 멤버.
// 1) 모든 프로젝트의 createdBy를 LEAD로 시드 (먼저 — skipDuplicates라 이미 LEAD/MEMBER면 그대로).
// 2) 회사 전체 멤버를 모든 프로젝트에 MEMBER로 백필.
//
// skipDuplicates 의미: (projectId, userId) 행이 이미 있으면 role을 덮어쓰지 않음.
// 따라서 createdBy 시드를 먼저 → 그 다음 회사 전체 MEMBER 시드 순서를 지켜야
// createdBy가 의도치 않게 MEMBER로 들어가는 일이 없음.

const prisma = require('../src/config/prisma');

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, companyId: true, createdById: true },
  });

  if (projects.length === 0) {
    console.log('[seed-project-members] no projects to seed');
    return;
  }

  // 1) createdBy LEAD 시드
  const leadRows = projects.map((p) => ({
    projectId: p.id,
    userId: p.createdById,
    role: 'LEAD',
  }));
  const leadResult = await prisma.projectMember.createMany({
    data: leadRows,
    skipDuplicates: true,
  });

  // 2) 회사 전체 멤버를 모든 프로젝트에 MEMBER 백필
  // 회사별로 멤버십 한 번씩만 조회 → cross product
  const companyIds = Array.from(new Set(projects.map((p) => p.companyId)));
  const memberRowsByCompany = new Map();
  for (const companyId of companyIds) {
    const memberships = await prisma.membership.findMany({
      where: { companyId },
      select: { userId: true },
    });
    memberRowsByCompany.set(companyId, memberships.map((m) => m.userId));
  }

  const memberRows = [];
  for (const p of projects) {
    const userIds = memberRowsByCompany.get(p.companyId) || [];
    for (const uid of userIds) {
      memberRows.push({ projectId: p.id, userId: uid, role: 'MEMBER' });
    }
  }

  let memberCount = 0;
  if (memberRows.length > 0) {
    const memberResult = await prisma.projectMember.createMany({
      data: memberRows,
      skipDuplicates: true,
    });
    memberCount = memberResult.count;
  }

  console.log(
    `[seed-project-members] seeded LEAD=${leadResult.count} MEMBER=${memberCount} ` +
    `(across ${projects.length} projects / ${companyIds.length} companies)`
  );
}

main()
  .catch((e) => {
    console.error('[seed-project-members] failed:', e.message);
    // 실패해도 server boot은 계속 (테이블 미존재 등 마이그 직후 케이스 대비)
    process.exitCode = 0;
  })
  .finally(() => prisma.$disconnect());
