// 회계서류.xlsm 보강 마이그레이션 (옵션 A — 2026-04-30, 1회성, idempotent)
//
// 기존 import_accounting_excel.js가 놓친 데이터 보강:
//   1. DB.비고 (memo, ~45건) → Expense.description 보강
//   2. Budget.비고 (부가세 정보) → Project.contractVatRate 채우기
//   3. Budget.상태 ("ㅇ" 마커) → 보고만 (자동 갱신 X — 사용자가 이미 손봤을 가능성)
//
// 실행:
//   node scripts/import_accounting_extras.js              # 실제 적용
//   node scripts/import_accounting_extras.js --dry-run    # 변경 없이 보고만
//   node scripts/import_accounting_extras.js [엑셀경로]   # 다른 경로
// 디폴트 경로: C:\Users\1988k\OneDrive\002_사내관리\04_회계_노무_세무자료\회계서류.xlsm

const path = require('path');
const fs = require('fs');
const prisma = require('../src/config/prisma');

let XLSX;
try { XLSX = require('xlsx'); }
catch (e) {
  console.error('❌ xlsx 패키지 없음. 설치: npm install xlsx');
  process.exit(1);
}

const DEFAULT_XLSX = 'C:\\Users\\1988k\\OneDrive\\002_사내관리\\04_회계_노무_세무자료\\회계서류.xlsm';

function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()));
  if (typeof v === 'string') {
    const cleaned = v.replace(/[./]/g, '-').slice(0, 10);
    return new Date(cleaned);
  }
  return null;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const excelPath = args.find((a) => !a.startsWith('--') && !a.startsWith('회사=')) || DEFAULT_XLSX;
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ 엑셀 파일 없음: ${excelPath}`);
    process.exit(1);
  }
  console.log(`▸ 엑셀: ${excelPath}`);
  if (dryRun) console.log(`▸ DRY RUN (실제 갱신 X)`);

  // 대상 회사 선택 — 슈퍼어드민(Suplex 관리) 등 빈 회사 제외
  // 1) env COMPANY_NAME 또는 인자 "회사=이름"
  // 2) 디폴트: "리플레이스 디자인" (실 운영 회사)
  const companyArg = args.find((a) => a.startsWith('회사='))?.slice(3);
  const targetName = process.env.COMPANY_NAME || companyArg || '리플레이스 디자인';

  const company = await prisma.company.findFirst({
    where: { name: targetName },
    select: { id: true, name: true },
  });
  if (!company) {
    console.error(`❌ 회사 못 찾음: "${targetName}"`);
    const all = await prisma.company.findMany({ select: { name: true } });
    console.error('가능한 회사:', all.map((c) => c.name).join(', '));
    process.exit(1);
  }
  const companyId = company.id;
  console.log(`▸ 대상: 회사 "${company.name}"`);

  const wb = XLSX.readFile(excelPath, { cellDates: true });
  const dbRows = XLSX.utils.sheet_to_json(wb.Sheets['DB'], { defval: null, header: 1 }).slice(1);
  const budgetRows = XLSX.utils.sheet_to_json(wb.Sheets['Budget'], { defval: null, header: 1 }).slice(1);

  // ============================================
  // STEP 1: Budget.비고 → Project.contractVatRate
  // ============================================
  console.log('\n[1/3] 부가세 정보 갱신...');
  const projects = await prisma.project.findMany({
    where: { companyId },
    select: { id: true, name: true, siteCode: true, contractVatRate: true },
  });
  const siteCodeToProject = new Map();
  for (const p of projects) if (p.siteCode) siteCodeToProject.set(p.siteCode, p);

  let vatUpdated = 0, vatSkipped = 0, vatUnchanged = 0;
  for (const row of budgetRows) {
    const siteCode = row[1] ? String(row[1]).trim() : null;
    const note = row[4] ? String(row[4]).trim() : null;
    if (!siteCode || !note) continue;

    const proj = siteCodeToProject.get(siteCode);
    if (!proj) { vatSkipped++; continue; }

    let nextRate = null;
    if (note.includes('부가세 포함')) nextRate = 10;
    else if (note.includes('부가세 미포함')) nextRate = 0;
    else continue; // "-"·기타 비고는 무시

    const currentRate = proj.contractVatRate != null ? Number(proj.contractVatRate) : null;
    if (currentRate === nextRate) { vatUnchanged++; continue; }

    if (!dryRun) {
      // select로 RETURNING 컬럼 제한 — 로컬 DB가 schema 뒤쳐진 케이스 방지
      await prisma.project.update({
        where: { id: proj.id },
        data: { contractVatRate: nextRate },
        select: { id: true },
      });
    }
    console.log(`  ${dryRun ? '·' : '✓'} "${proj.name}" (${siteCode}): contractVatRate ${currentRate ?? 'null'} → ${nextRate} (${note})`);
    vatUpdated++;
  }
  console.log(`  ${vatUpdated}건 갱신 / ${vatUnchanged}건 이미 동일 / ${vatSkipped}건 프로젝트 매칭 실패`);

  // ============================================
  // STEP 2a: 기존 description에 박힌 (메모: ...) → memo 필드로 이동 + description 정리
  // 이전 버전 스크립트가 description 끝에 " (메모: ...)" 붙인 케이스 정리.
  // ============================================
  console.log('\n[2a/3] 기존 description 안 (메모: ...) 추출 → memo 필드로 이동...');
  const memoPattern = / \(메모: ([^)]+)\)$/;
  const dirtied = await prisma.expense.findMany({
    where: { companyId, description: { contains: '(메모: ' } },
    select: { id: true, description: true, memo: true },
  });
  let extractedCount = 0;
  for (const exp of dirtied) {
    const m = exp.description && exp.description.match(memoPattern);
    if (!m) continue;
    const memoText = m[1].trim();
    const cleanDesc = exp.description.replace(memoPattern, '').trim() || null;
    // memo 이미 있으면 그대로 두고 description만 정리
    const nextMemo = exp.memo || memoText;
    if (!dryRun) {
      await prisma.expense.update({
        where: { id: exp.id },
        data: { description: cleanDesc, memo: nextMemo },
        select: { id: true },
      });
    }
    extractedCount++;
  }
  console.log(`  ${extractedCount}건 추출 완료 (description 정리 + memo 필드로 이동)`);

  // ============================================
  // STEP 2b: DB.비고 → Expense.memo 보강
  // ============================================
  console.log('\n[2b/3] 거래 메모 보강...');
  let memoMatched = 0, memoUpdated = 0, memoMulti = 0, memoNoMatch = 0, memoAlready = 0;

  for (const row of dbRows) {
    const memo = row[8] ? String(row[8]).trim() : null;
    if (!memo) continue;

    const date = parseDate(row[0]);
    const outAmt = Number(row[2]) || 0;
    const inAmt = Number(row[3]) || 0;
    const amount = Math.max(outAmt, inAmt);
    const content = row[1] ? String(row[1]).trim() : null;
    if (!date || amount === 0) continue;

    // 매칭: 같은 회사 + 같은 날짜 + 같은 금액 + description 정확 일치
    const matches = await prisma.expense.findMany({
      where: { companyId, date, amount, description: content || undefined },
      select: { id: true, description: true, memo: true },
    });

    if (matches.length === 0) {
      memoNoMatch++;
      console.log(`  ⚠ 매칭 실패: ${date.toISOString().slice(0,10)} · ${content?.slice(0,15)} · ${amount.toLocaleString('ko-KR')}원 (메모: ${memo})`);
      continue;
    }
    if (matches.length > 1) {
      memoMulti++;
      console.log(`  ⚠ 다중 매칭(${matches.length}건) 스킵: ${date.toISOString().slice(0,10)} · ${content?.slice(0,15)} · ${amount.toLocaleString('ko-KR')}원 (메모: ${memo})`);
      continue;
    }
    memoMatched++;

    const exp = matches[0];
    // 이미 memo 들어가 있으면 스킵 (idempotent)
    if (exp.memo === memo) {
      memoAlready++;
      continue;
    }
    if (!dryRun) {
      await prisma.expense.update({
        where: { id: exp.id },
        data: { memo },
        select: { id: true },
      });
    }
    if (dryRun) console.log(`  · ${date.toISOString().slice(0,10)} · ${content?.slice(0,15)}: memo "${exp.memo || ''}" → "${memo}"`);
    memoUpdated++;
  }
  console.log(`  ${memoUpdated}건 보강 / ${memoAlready}건 이미 반영 / ${memoMatched}건 매칭 / ${memoMulti}건 다중매칭 스킵 / ${memoNoMatch}건 매칭실패`);

  // ============================================
  // STEP 3: Budget.상태 ("ㅇ" 마커) — 보고만
  // ============================================
  console.log('\n[3/3] 진행 상태 마커 보고 (자동 갱신 X)...');
  const activeMarked = [];
  const completedNoMark = [];
  for (const row of budgetRows) {
    const status = row[0] ? String(row[0]).trim() : null;
    const siteCode = row[1] ? String(row[1]).trim() : null;
    if (!siteCode) continue;
    const proj = siteCodeToProject.get(siteCode);
    if (!proj) continue;
    if (status === 'ㅇ') activeMarked.push({ siteCode, name: proj.name });
    else completedNoMark.push({ siteCode, name: proj.name });
  }
  console.log(`  📌 회계서류상 진행 중(ㅇ): ${activeMarked.length}건`);
  for (const p of activeMarked) console.log(`     - ${p.name} (${p.siteCode})`);
  console.log(`  📌 회계서류상 종료/마커 없음: ${completedNoMark.length}건`);
  for (const p of completedNoMark) console.log(`     - ${p.name} (${p.siteCode})`);
  console.log('  → Suplex Project.status는 사용자가 이미 손봤을 가능성 → 자동 갱신 X. 위 목록 참고해 어드민이 직접 조정.');

  // ============================================
  // 요약
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log(dryRun ? '🔍 DRY RUN 완료 (실제 갱신 X)' : '✅ 보강 마이그레이션 완료');
  console.log('='.repeat(50));
  console.log(`부가세: ${vatUpdated}건 갱신`);
  console.log(`거래 메모: ${memoUpdated}건 보강 (${memoNoMatch}건 매칭실패)`);
  console.log(`진행상태: 자동 갱신 X (보고만 — 위 목록 참고)`);
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ 에러:', e);
  process.exit(1);
});
