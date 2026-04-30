// Expense.vendor 백필 (1회성, idempotent — 2026-04-30)
//
// 배경: 기존 import_accounting_excel.js가 회계서류 description은 채웠지만
// vendor 텍스트 필드는 null로 둠. 결과로 회계서류 import된 거래 1,777건이
// vendor 정보 없이 description만 갖고 있는 상태. AI비서·자동분류·출구정리
// 추론엔진의 거래처 매칭 신호를 못 쓰는 부조리.
//
// 회계서류 description 자체가 거래처명 패턴이므로 1:1 복사로 백필.
// (예: "주식회사 장식강원센", "(주)삼성홈센터", "한성민-온스")
//
// 실행:
//   railway run node scripts/backfill_vendor_text.js --dry-run
//   railway run node scripts/backfill_vendor_text.js
//   회사명 변경: COMPANY_NAME="다른회사" ... 또는 인자 "회사=다른회사"

const prisma = require('../src/config/prisma');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const companyArg = args.find((a) => a.startsWith('회사='))?.slice(3);
  const targetName = process.env.COMPANY_NAME || companyArg || '리플레이스 디자인';

  const company = await prisma.company.findFirst({
    where: { name: targetName },
    select: { id: true, name: true },
  });
  if (!company) {
    console.error(`❌ 회사 못 찾음: "${targetName}"`);
    process.exit(1);
  }
  console.log(`▸ 대상: 회사 "${company.name}"`);
  if (dryRun) console.log(`▸ DRY RUN`);

  // 후보: vendor null + description 존재
  const targets = await prisma.expense.findMany({
    where: {
      companyId: company.id,
      vendor: null,
      description: { not: null },
    },
    select: { id: true, description: true, importedFrom: true },
  });

  console.log(`\n후보: ${targets.length}건 (vendor null + description 있음)`);
  if (targets.length === 0) { console.log('갱신 대상 없음.'); process.exit(0); }

  // 분포 — importedFrom 별
  const byImport = {};
  for (const t of targets) {
    const k = t.importedFrom || '(unknown)';
    byImport[k] = (byImport[k] || 0) + 1;
  }
  console.log('importedFrom 분포:');
  for (const [k, v] of Object.entries(byImport)) console.log(`  ${k}: ${v}건`);

  // description 길이 분포 (이상 케이스 식별)
  const lenDist = { '0~10': 0, '11~20': 0, '21~30': 0, '31~50': 0, '51~': 0 };
  for (const t of targets) {
    const l = t.description.length;
    if (l <= 10) lenDist['0~10']++;
    else if (l <= 20) lenDist['11~20']++;
    else if (l <= 30) lenDist['21~30']++;
    else if (l <= 50) lenDist['31~50']++;
    else lenDist['51~']++;
  }
  console.log('description 길이 분포:');
  for (const [k, v] of Object.entries(lenDist)) console.log(`  ${k}자: ${v}건`);

  // 긴 description 샘플 (50자 초과는 거래처명 아닐 가능성 — 검토용)
  const longOnes = targets.filter((t) => t.description.length > 50).slice(0, 5);
  if (longOnes.length > 0) {
    console.log('\n긴 description 샘플 (50자 초과 — 정상 거래처명 아닐 수 있음):');
    for (const t of longOnes) console.log(`  [${t.description.length}자] ${t.description.slice(0, 80)}...`);
  }

  // 실행 — description을 vendor 텍스트로 복사 (1:1, vendorId 변화 X)
  if (!dryRun) {
    let updated = 0;
    for (const t of targets) {
      await prisma.expense.update({
        where: { id: t.id },
        data: { vendor: t.description.trim() },
        select: { id: true },
      });
      updated++;
      if (updated % 200 === 0) process.stdout.write(`\r  ${updated}/${targets.length} 갱신...`);
    }
    console.log(`\n  ✓ ${updated}건 vendor 백필 완료`);
  } else {
    console.log(`\n[DRY RUN] ${targets.length}건이 갱신될 예정 (vendor = description 복사).`);
  }

  process.exit(0);
}

main().catch((e) => { console.error('❌ 에러:', e); process.exit(1); });
