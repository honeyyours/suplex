// 슈퍼 어드민 시드 — 1회 실행 (마이그레이션 후)
// 사용:
//   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=<강한_비번> node scripts/seed-super-admin.js
//
// 자격증명 노출 금지 영구 규칙: 비번은 환경변수로만 입력. 코드/메모리/채팅 평문 X.
// production 적용 시 prod DATABASE_URL 환경변수도 같이 주입.

const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email) {
    console.error('❌ ADMIN_EMAIL 환경변수가 필요합니다');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('❌ ADMIN_PASSWORD는 12자 이상이어야 합니다 (어드민은 강하게)');
    process.exit(1);
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    console.error('❌ 유효하지 않은 이메일 형식');
    process.exit(1);
  }

  // 이미 존재하면 isSuperAdmin = true로 승격
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.isSuperAdmin) {
      console.log(`✓ ${email} 은 이미 슈퍼 어드민입니다 (id=${existing.id})`);
      return;
    }
    await prisma.user.update({
      where: { id: existing.id },
      data: { isSuperAdmin: true },
    });
    console.log(`✓ ${email} 을 슈퍼 어드민으로 승격했습니다 (id=${existing.id})`);
    console.log(`  기존 비밀번호 그대로 사용. 변경하려면 어드민 콘솔에서 본인 비번 변경.`);
    return;
  }

  // 신규 어드민 계정 생성 (회사 멤버십 없음)
  const passwordHash = await bcrypt.hash(password, 10);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Suplex Admin',
      isSuperAdmin: true,
    },
  });
  console.log(`✓ 슈퍼 어드민 계정 생성 완료`);
  console.log(`  email: ${created.email}`);
  console.log(`  id:    ${created.id}`);
  console.log(`  비번은 ADMIN_PASSWORD 환경변수에 주신 값. 안전하게 보관하세요.`);
  console.log(`  로그인 후 즉시 어드민 콘솔에서 비번 변경 가능 (정식 출시 시 강제 예정).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
