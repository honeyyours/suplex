// 일회용 — 기존 시공팀(CREW) 사용자에 회사 자동 생성·OWNER 매핑 백필.
// 봉기님 결정(2026-05-17): 시공팀도 본인 1인 회사 OWNER로 작동. 회사가 없는 기존 CREW 사용자에게만 적용.

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const crewUsers = await prisma.user.findMany({
    where: { accountType: 'CREW' },
    select: { id: true, name: true, email: true, phone: true },
  });
  console.log(`CREW 사용자 ${crewUsers.length}명 검사 중...`);

  let created = 0;
  let skipped = 0;
  for (const u of crewUsers) {
    const existing = await prisma.membership.findFirst({
      where: { userId: u.id },
      select: { id: true, companyId: true },
    });
    if (existing) {
      console.log(`  - ${u.name} (${u.email}): 이미 회사 보유 (companyId=${existing.companyId}) — skip`);
      skipped++;
      continue;
    }
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: u.name,
          representative: u.name,
          email: u.email,
          phone: u.phone || null,
          plan: 'CREW',
          approvalStatus: 'APPROVED',
        },
        select: { id: true, name: true, plan: true },
      });
      await tx.membership.create({ data: { userId: u.id, companyId: company.id, role: 'OWNER' } });
      // 기존 토큰 무효화 → 다음 요청에서 자동 로그아웃 → 새 토큰으로 회사 컨텍스트 포함
      await tx.user.update({ where: { id: u.id }, data: { tokenVersion: { increment: 1 } } });
      return company;
    });
    console.log(`  ✓ ${u.name} (${u.email}): company "${result.name}" plan=${result.plan} 생성`);
    created++;
  }

  console.log(`\n완료 — 생성 ${created}건, skip ${skipped}건`);
  await prisma.$disconnect();
})().catch((e) => {
  console.error('백필 실패:', e);
  process.exit(1);
});
