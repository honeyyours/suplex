// 회계서류.xlsm → 스플렉스 일괄 마이그레이션 (일회성)
// 실행: node scripts/import_accounting_excel.js [엑셀경로] [json경로]
//
// 필요: 회계서류.xlsm을 먼저 Python 분석 스크립트로 JSON 추출 후 사용
// 또는 이 스크립트 안에서 직접 xlsx 파싱 (xlsx 패키지 필요)

const path = require('path');
const fs = require('fs');
const prisma = require('../src/config/prisma');

// ============================================
// 1) 엑셀 → JSON (xlsx 패키지로 직접 읽기)
// ============================================
let XLSX;
try { XLSX = require('xlsx'); }
catch (e) {
  console.error('❌ xlsx 패키지 없음. 설치: npm install xlsx');
  process.exit(1);
}

function readExcel(excelPath) {
  const wb = XLSX.readFile(excelPath, { cellDates: true });
  const out = {};
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    out[name] = XLSX.utils.sheet_to_json(ws, { defval: null, header: 1 });
  }
  return out;
}

// ============================================
// 2) 매핑 정의
// ============================================
// 기존 7개 스플렉스 프로젝트 ↔ 엑셀 현장코드 수동 매칭
// (web calendar import 시 만든 이름 기준)
const NAME_TO_SITECODE = {
  '온스트릿': '2602_온스트릿',
  '현진에버빌 3차': '2602_현진에버빌3차',
  '칠전대우2차': '2602_칠전대우2차',
  '남부노인회관': '2602_남부노인회관',
  '이현 법률사무소': '2603_변호사이현',
  '서희아파트': '2602_양구서희',
  // '기타 일정' — 엑셀에 매칭 없음, siteCode null 유지
};

// 엑셀 거래의 type 결정 (계정과목 기준)
function detectType(account, outAmt, inAmt) {
  if (!account) return 'EXPENSE';
  if (account.startsWith('[자금]')) return 'TRANSFER';
  if (account.startsWith('[매출]')) return 'INCOME';
  if (account.startsWith('[기타]') && (Number(inAmt) > 0)) return 'INCOME';
  return 'EXPENSE';
}

// 엑셀 날짜를 ISO YYYY-MM-DD로
function parseDate(v) {
  if (!v) return null;
  if (v instanceof Date) return new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()));
  if (typeof v === 'string') {
    // "2026-03-31" or "2026-04-01 00:00:00" or "2026.04.01"
    const cleaned = v.replace(/[./]/g, '-').slice(0, 10);
    return new Date(cleaned);
  }
  return null;
}

// ============================================
// 3) 메인
// ============================================
async function main() {
  const excelPath = process.argv[2] || path.resolve(__dirname, '../../_temp_accounting.xlsm');
  if (!fs.existsSync(excelPath)) {
    console.error(`❌ 엑셀 파일 없음: ${excelPath}`);
    process.exit(1);
  }
  console.log(`▸ 엑셀: ${excelPath}`);

  // OWNER 사용자/회사 찾기
  const owner = await prisma.membership.findFirst({
    where: { role: 'OWNER' },
    include: { user: true, company: true },
    orderBy: { createdAt: 'asc' },
  });
  if (!owner) { console.error('❌ OWNER 없음'); process.exit(1); }
  const companyId = owner.companyId;
  const userId = owner.userId;
  console.log(`▸ 대상: 회사 "${owner.company.name}" (${owner.user.name})`);

  // 엑셀 파싱
  const sheets = readExcel(excelPath);
  console.log(`▸ 시트: ${Object.keys(sheets).join(', ')}`);

  // ============================================
  // STEP 1: AccountCode 시드 (26개)
  // ============================================
  console.log('\n[1/6] 계정과목 시드...');
  const configRows = sheets['Config'].slice(1); // header 제외
  const accountSet = new Map(); // code → groupName
  for (const row of configRows) {
    const acct = row[1]; // 계정과목 컬럼
    if (!acct) continue;
    const trimmed = String(acct).trim();
    if (!trimmed || trimmed === '00.총계약금액' || trimmed === '00.추가계약금') continue;
    // groupName 추출 ("[본사] 복리후생비" → "본사")
    const m = trimmed.match(/^\[(.+?)\]/);
    const groupName = m ? m[1] : '기타';
    if (!accountSet.has(trimmed)) accountSet.set(trimmed, groupName);
  }
  // DB의 실제 계정과목도 추가 (Config에 없을 수 있음)
  const dbRows = sheets['DB'].slice(1);
  for (const row of dbRows) {
    const acct = row[6];
    if (!acct) continue;
    const trimmed = String(acct).trim();
    if (!accountSet.has(trimmed)) {
      const m = trimmed.match(/^\[(.+?)\]/);
      const groupName = m ? m[1] : '기타';
      accountSet.set(trimmed, groupName);
    }
  }

  let orderIdx = 0;
  const accountCodeMap = new Map(); // code → id
  for (const [code, groupName] of accountSet) {
    const ac = await prisma.accountCode.upsert({
      where: { companyId_code: { companyId, code } },
      update: {},
      create: { companyId, code, groupName, orderIndex: orderIdx++, createdById: userId },
    });
    accountCodeMap.set(code, ac.id);
  }
  console.log(`  ✓ ${accountCodeMap.size}개 계정과목 시드 완료`);

  // ============================================
  // STEP 2: Project siteCode 매핑 (기존 7개)
  // ============================================
  console.log('\n[2/6] 기존 프로젝트 siteCode 매핑...');
  const existingProjects = await prisma.project.findMany({ where: { companyId } });
  let mappedCount = 0;
  for (const p of existingProjects) {
    const siteCode = NAME_TO_SITECODE[p.name];
    if (siteCode) {
      await prisma.project.update({ where: { id: p.id }, data: { siteCode } });
      console.log(`  ✓ "${p.name}" → ${siteCode}`);
      mappedCount++;
    }
  }
  console.log(`  ${mappedCount}/${existingProjects.length}개 매핑됨`);

  // ============================================
  // STEP 3: 새 Project 생성 (엑셀에만 있는 14개 + 0000_* 제외)
  // ============================================
  console.log('\n[3/6] 신규 프로젝트 생성 (엑셀에만 있는 현장)...');
  const allProjectsAfter = await prisma.project.findMany({ where: { companyId } });
  const existingSiteCodes = new Set(allProjectsAfter.map((p) => p.siteCode).filter(Boolean));

  // 엑셀의 모든 현장코드 수집
  const allSiteCodes = new Set();
  for (const row of dbRows) {
    if (row[5]) allSiteCodes.add(String(row[5]).trim());
  }
  for (const row of configRows) {
    if (row[0]) allSiteCodes.add(String(row[0]).trim());
  }

  // Budget 시트로 contractAmount 매핑
  const budgetRows = sheets['Budget'].slice(1);
  const budgetMap = new Map(); // siteCode → contractAmount
  for (const row of budgetRows) {
    const site = row[1];
    const work = row[2];
    const amount = row[3];
    if (site && work === '00.총계약금액' && amount) {
      budgetMap.set(String(site).trim(), Number(amount));
    }
  }

  let createdCount = 0;
  const newProjectMap = new Map(); // siteCode → newProjectId
  for (const siteCode of allSiteCodes) {
    if (siteCode.startsWith('0000_')) continue; // 본사/대표는 Project X
    if (existingSiteCodes.has(siteCode)) continue; // 이미 매핑됨
    // 이름에서 prefix 제거 (예: "2509_홍천오브커피" → "홍천오브커피")
    const cleanName = siteCode.replace(/^\d{4}_/, '');
    const newProj = await prisma.project.create({
      data: {
        companyId,
        createdById: userId,
        name: cleanName,
        siteCode,
        customerName: '(미입력)',
        siteAddress: '(미입력)',
        contractAmount: budgetMap.get(siteCode) || null,
        status: 'IN_PROGRESS', // 사용자가 나중에 조정
        memo: `엑셀 회계서류에서 자동 생성됨 (${siteCode})`,
      },
    });
    newProjectMap.set(siteCode, newProj.id);
    console.log(`  ✓ ${siteCode} → ${cleanName} ${newProj.contractAmount ? `(계약 ${Number(newProj.contractAmount).toLocaleString('ko-KR')}원)` : ''}`);
    createdCount++;
  }
  console.log(`  ${createdCount}개 신규 생성`);

  // 전체 siteCode → projectId 맵
  const allProjectsFinal = await prisma.project.findMany({ where: { companyId } });
  const siteCodeToProjectId = new Map();
  for (const p of allProjectsFinal) {
    if (p.siteCode) siteCodeToProjectId.set(p.siteCode, p.id);
  }

  // ============================================
  // STEP 4: 기존 7개 Project의 contractAmount 업데이트 (Budget 기준)
  // ============================================
  console.log('\n[4/6] 기존 프로젝트 계약금액 갱신 (Budget 기준)...');
  let updatedContractCount = 0;
  for (const p of existingProjects) {
    if (!p.siteCode) continue;
    const budgetAmount = budgetMap.get(p.siteCode);
    if (budgetAmount && Number(p.contractAmount || 0) !== budgetAmount) {
      await prisma.project.update({
        where: { id: p.id },
        data: { contractAmount: budgetAmount },
      });
      console.log(`  ✓ "${p.name}": 계약금액 → ${budgetAmount.toLocaleString('ko-KR')}원`);
      updatedContractCount++;
    }
  }
  console.log(`  ${updatedContractCount}개 갱신`);

  // ============================================
  // STEP 5: ExpenseCategoryRule 시드 (113개)
  // ============================================
  console.log('\n[5/6] 자동분류 룰 시드...');
  let ruleCount = 0;
  for (const row of configRows) {
    const keyword = row[3]; // 자동분류_키워드
    const acct = row[4];    // 자동분류_계정
    const site = row[5];    // 자동분류_현장
    const work = row[6];    // 자동분류_공종
    if (!keyword) continue;
    const accountCodeId = acct ? accountCodeMap.get(String(acct).trim()) : null;
    await prisma.expenseCategoryRule.create({
      data: {
        companyId,
        keyword: String(keyword).trim(),
        accountCodeId: accountCodeId || null,
        siteCode: site ? String(site).trim() : null,
        workCategory: work ? String(work).trim() : null,
        priority: 0,
        active: true,
        createdById: userId,
      },
    });
    ruleCount++;
  }
  console.log(`  ✓ ${ruleCount}개 룰 시드`);

  // ============================================
  // STEP 6: Expense 1,780건 일괄 마이그레이션
  // ============================================
  console.log('\n[6/6] 거래 데이터 마이그레이션...');
  const expenseRows = [];
  let skipped = 0;
  for (const row of dbRows) {
    const [date, content, outAmt, inAmt, balance, siteCode, account, work, memo] = row;
    if (!date && !content) continue;
    const parsedDate = parseDate(date);
    if (!parsedDate) { skipped++; continue; }
    const amount = Math.max(Number(outAmt) || 0, Number(inAmt) || 0);
    if (amount === 0) { skipped++; continue; }
    const type = detectType(account, outAmt, inAmt);
    const siteCodeStr = siteCode ? String(siteCode).trim() : null;
    const projectId = siteCodeStr && !siteCodeStr.startsWith('0000_')
      ? (siteCodeToProjectId.get(siteCodeStr) || null)
      : null;
    const accountCodeId = account ? (accountCodeMap.get(String(account).trim()) || null) : null;

    expenseRows.push({
      companyId,
      projectId,
      date: parsedDate,
      amount,
      type,
      vendor: null, // 엑셀에 별도 vendor 컬럼 없음
      accountCodeId,
      workCategory: work ? String(work).trim() : null,
      description: content ? String(content).trim() : null,
      paymentMethod: null,
      importedFrom: '엑셀 회계서류',
      rawText: row.filter(Boolean).join(' | '),
      createdById: userId,
    });
  }

  // 청크로 나눠 insert (createMany 한도 우회)
  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < expenseRows.length; i += CHUNK) {
    const chunk = expenseRows.slice(i, i + CHUNK);
    const r = await prisma.expense.createMany({ data: chunk });
    inserted += r.count;
    process.stdout.write(`\r  ▸ ${inserted}/${expenseRows.length}건 삽입 중...`);
  }
  console.log(`\n  ✓ ${inserted}건 삽입 (스킵 ${skipped}건)`);

  // ============================================
  // 요약
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('✅ 마이그레이션 완료');
  console.log('='.repeat(50));
  const finalAcct = await prisma.accountCode.count({ where: { companyId } });
  const finalRules = await prisma.expenseCategoryRule.count({ where: { companyId } });
  const finalProj = await prisma.project.count({ where: { companyId } });
  const finalExp = await prisma.expense.count({ where: { companyId } });
  const expByType = await prisma.expense.groupBy({
    by: ['type'],
    where: { companyId },
    _sum: { amount: true },
    _count: true,
  });
  console.log(`계정과목: ${finalAcct}개`);
  console.log(`자동분류 룰: ${finalRules}개`);
  console.log(`프로젝트: ${finalProj}개`);
  console.log(`거래: ${finalExp}건`);
  for (const g of expByType) {
    console.log(`  ${g.type}: ${g._count}건 / ${Number(g._sum.amount).toLocaleString('ko-KR')}원`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error('❌ 에러:', e);
  process.exit(1);
});
