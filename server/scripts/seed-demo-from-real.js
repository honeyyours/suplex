// 가상 데모 계정 시드 — 리플레이스 디자인의 서희아파트 프로젝트를 변형 복사 (2026-05-17).
//
// 변형 규칙 (봉기님 결정):
//   - 회사명·이메일·사업자번호 → 데모 회사 정보로 갈아끼움
//   - Vendor.name·contact·phone·bankAccount → 가명 (unitPrice·defaultMeal 등은 그대로)
//   - Project.name·customerName·customerPhone·siteAddress·doorPassword → 가상
//   - 견적 supplier* / clientName / projectName → 데모 회사·고객님으로
//   - 견적금액·일정 구성·마감재 구성·발주 패턴·체크리스트·메모 → 그대로 (실 패턴 가치)
//   - 회사 자산 (MaterialTemplate·QuoteTemplate·Rule 4종·AccountCode·ExpenseRule) → 그대로 복사
//
// 사용:
//   DEMO_OWNER_EMAIL=demo@suplex.kr \
//   DEMO_OWNER_PASSWORD=<12자_이상> \
//   railway run --service suplex node scripts/seed-demo-from-real.js
//
// idempotent: 데모 회사·OWNER·멤버십은 재사용, 자산은 wipe+재시드, 메인 프로젝트는 siteCode 매칭으로 wipe+재생성

const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');
const { seedAllBundlesFromPresetIfAvailable } = require('../src/services/phasePreset');

const DEMO_COMPANY_NAME = '수플렉스 데모 인테리어';
const REAL_COMPANY_NAME_LIKE = '리플레이스';
const SOURCE_PROJECT_NAME_LIKE = '서희';
const DEMO_SITE_CODE = 'DEMO_PROJECT_FROM_REAL';
const DEMO_START_OFFSET_DAYS = -5; // 데모 프로젝트 startDate = 오늘 + 이 값 (-5 = 오늘로부터 5일 전 시작)
const DEMO_PROJECT_NAME = '데모 - 강남 32평 아파트 리모델링';
const DEMO_CUSTOMER_NAME = '고객님';
const DEMO_CUSTOMER_PHONE = '010-1234-5678';
const DEMO_SITE_ADDRESS = '서울 강남구 가상로 100, 데모아파트 304동 1502호';
const DEMO_DOOR_PASSWORD = '*0000';

const FAKE_VENDOR_PREFIXES = [
  '동현', '한솔', '유로', '신한', '대일', '효성', '우리', '한길', '대성', '명진',
  '진흥', '서원', '동방', '한라', '대양', '광성', '신영', '한국', '동남', '국제',
];

const LOUNGE_POSTS = [
  { category: 'free', title: '30평 리모델링 평당 단가 — 요즘 어디까지 받으세요?',
    body: '강남권 30평대 풀 리모델링 견적 단가가 궁금합니다.\n자재 인상 반영해서 평당 250~280 정도 받고 있는데, 다른 지역·다른 업체 분들은 어느 정도인지 공유 부탁드립니다.' },
  { category: 'free', title: '욕실 누수 — 위층 vs 같은 층 진단 빠르게 하는 팁',
    body: '욕실 천장에서 물 떨어진다고 콜 받았을 때 위/아래 가리는 법.\n1) 위층 부재중이면 우리 집 누수 우선 의심\n2) 천장 점검구 전 줄눈·실리콘 손으로 눌러보기\n3) 슬라브 콘크리트 상태 확인.' },
  { category: 'free', title: '입주 청소 — 외주 vs 직접',
    body: '30평 기준 외주 35~50만원, 직접 1.5일·인력 2. 거실·주방 외주 + 욕실·창호 직접으로 분리.' },
  { category: 'free', title: '클라이언트 첫 미팅에서 꼭 묻는 5가지',
    body: '1) 입주 예정일 2) 가족 구성 3) 예산 상한 vs 희망 4) 가전 구매 여부 5) 라이프스타일.' },
  { category: 'ruby', title: '스케치업 작업 속도 2배 — 단축키 + 자주 쓰는 루비',
    body: 'L·R·C·M·Q·S·P 단축키. s4u_make_face / ThomThom Cleanup / Curic Section.' },
  { category: 'ruby', title: '커튼월 자동 분할 루비 공유 [무료]',
    body: '커튼월 모듈 폭/높이 입력 → 자동 멀리언 분할. 외장 도면 작업 자동화.' },
  { category: 'request', title: '서울 강남 — 욕실 타일 시공팀 추천 부탁드립니다',
    body: '6월 둘째주 욕실 풀 타일. 욕실 2개, 300×600 벽 + 300×300 바닥. 자재 준비됨.' },
  { category: 'request', title: '도배사 구인 — 단발성 1주, 일당 협의',
    body: '7월 첫째주 5일 30평 풀 도배. 실크벽지, 천장 포함. DM 부탁.' },
];

function fakeVendorName(category, idx) {
  const prefix = FAKE_VENDOR_PREFIXES[idx % FAKE_VENDOR_PREFIXES.length];
  const cat = (category || '').trim() || '거래처';
  return `${prefix}${cat}`;
}

function startOfDay(d) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
// source.startDate → 오늘+DEMO_START_OFFSET_DAYS 로 이동시키기 위한 offset (일)
function computeShiftOffset(sourceStartDate) {
  if (!sourceStartDate) return 0;
  const today = startOfDay(new Date());
  const target = addDays(today, DEMO_START_OFFSET_DAYS);
  return Math.floor((target - startOfDay(sourceStartDate)) / 86400000);
}
function shift(d, offsetDays) {
  if (!d) return null;
  return addDays(new Date(d), offsetDays);
}

// ────────────────────────────────────────────────────────────
// 1. 데모 회사·OWNER·멤버십 idempotent
// ────────────────────────────────────────────────────────────
async function ensureDemoCompany() {
  let co = await prisma.company.findFirst({ where: { name: DEMO_COMPANY_NAME } });
  if (!co) {
    co = await prisma.company.create({
      data: {
        name: DEMO_COMPANY_NAME,
        phone: '02-555-1234',
        address: '서울 강남구 테헤란로 100',
        bizNumber: '000-00-00000',
        representative: '데모 대표',
        email: 'hello@demo.suplex.kr',
        approvalStatus: 'APPROVED',
        plan: 'PRO',
      },
    });
    console.log(`✓ 데모 회사 신규 생성 (id=${co.id})`);
  } else {
    await prisma.company.update({
      where: { id: co.id },
      data: { approvalStatus: 'APPROVED', plan: 'PRO' },
    });
    console.log(`✓ 데모 회사 재사용 (id=${co.id})`);
  }
  return co;
}

async function ensureOwner(email, password, ownerName, nickname) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const passwordHash = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: { email, passwordHash, name: ownerName, nickname },
    });
    console.log(`✓ OWNER 유저 신규 (${email})`);
  } else {
    if (nickname && !user.nickname) {
      await prisma.user.update({ where: { id: user.id }, data: { nickname } });
    }
    console.log(`✓ OWNER 유저 재사용 (${email}) — 비번 미변경`);
  }
  return user;
}

async function ensureMembership(userId, companyId) {
  const m = await prisma.membership.findFirst({ where: { userId, companyId } });
  if (!m) {
    await prisma.membership.create({ data: { userId, companyId, role: 'OWNER' } });
    console.log('✓ 멤버십 OWNER 생성');
  } else if (m.role !== 'OWNER') {
    await prisma.membership.update({ where: { id: m.id }, data: { role: 'OWNER' } });
    console.log('✓ 멤버십 OWNER 승격');
  } else {
    console.log('✓ 멤버십 재사용 (OWNER)');
  }
}

// ────────────────────────────────────────────────────────────
// 2. 리플레이스 디자인 + 서희아파트 찾기
// ────────────────────────────────────────────────────────────
async function findRealCompany() {
  return prisma.company.findFirst({
    where: { name: { contains: REAL_COMPANY_NAME_LIKE } },
  });
}

async function findSourceProject(realCompanyId) {
  return prisma.project.findFirst({
    where: { companyId: realCompanyId, name: { contains: SOURCE_PROJECT_NAME_LIKE } },
    include: {
      materials: true,
      simpleQuotes: { include: { lines: { orderBy: { orderIndex: 'asc' } } } },
      dailyScheduleEntries: { orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }] },
      purchaseOrders: true,
      checklists: { orderBy: { orderIndex: 'asc' } },
      projectMemos: { orderBy: { createdAt: 'asc' } },
      settlementNotes: true,
      phaseNotes: true,
    },
  });
}

// ────────────────────────────────────────────────────────────
// 3. 회사 자산 9종 복사 (Vendor 가명, 나머지 그대로)
// ────────────────────────────────────────────────────────────
async function wipeDemoAssets(demoCompanyId) {
  // 데모 회사의 기존 자산 wipe (idempotent 재시드 보장)
  await prisma.expenseCategoryRule.deleteMany({ where: { companyId: demoCompanyId } });
  await prisma.accountCode.deleteMany({ where: { companyId: demoCompanyId } });
  await prisma.companyPhaseTip.deleteMany({ where: { companyId: demoCompanyId } });
  await prisma.phaseAdvice.deleteMany({ where: { companyId: demoCompanyId, ruleType: { not: 'UNCONFIRMED_CHECK' } } });
  await prisma.phaseDeadlineRule.deleteMany({ where: { companyId: demoCompanyId } });
  await prisma.phaseKeywordRule.deleteMany({ where: { companyId: demoCompanyId } });
  await prisma.quoteLineItemTemplate.deleteMany({ where: { companyId: demoCompanyId } });
  await prisma.materialTemplate.deleteMany({ where: { companyId: demoCompanyId } });
  await prisma.vendor.deleteMany({ where: { companyId: demoCompanyId } });
  console.log('✓ 데모 회사 기존 자산 wipe');
}

async function copyVendors(realCompanyId, demoCompanyId) {
  const real = await prisma.vendor.findMany({
    where: { companyId: realCompanyId },
    orderBy: { id: 'asc' },
  });
  const idMap = new Map(); // realVendorId → newVendorId
  const nameMap = new Map(); // realVendorName → fakeName (PurchaseOrder.vendor 문자열 매핑용)
  for (let i = 0; i < real.length; i++) {
    const v = real[i];
    const fakeName = fakeVendorName(v.category, i);
    const newV = await prisma.vendor.create({
      data: {
        companyId: demoCompanyId,
        name: fakeName,
        category: v.category,
        contact: v.contact ? '담당자' : null,
        phone: v.phone ? '010-0000-0000' : null,
        unit: v.unit,
        bankAccount: v.bankAccount ? '국민 000-00-000000' : null,
        memo: v.memo || null,
        unitPrice: v.unitPrice,
        defaultMeal: v.defaultMeal,
        defaultTransport: v.defaultTransport,
      },
    });
    idMap.set(v.id, newV.id);
    nameMap.set(v.name, fakeName);
  }
  console.log(`✓ Vendor ${real.length}건 복사 (모두 가명화)`);
  return { idMap, nameMap };
}

async function copyMaterialTemplates(realCompanyId, demoCompanyId) {
  const rows = await prisma.materialTemplate.findMany({ where: { companyId: realCompanyId } });
  if (rows.length === 0) { console.log('· MaterialTemplate 0건'); return; }
  await prisma.materialTemplate.createMany({
    data: rows.map((m) => ({
      companyId: demoCompanyId,
      kind: m.kind,
      spaceGroup: m.spaceGroup,
      subgroup: m.subgroup,
      itemName: m.itemName,
      formKey: m.formKey,
      defaultSiteNotes: m.defaultSiteNotes,
      essential: m.essential,
      orderIndex: m.orderIndex,
      active: m.active,
    })),
  });
  console.log(`✓ MaterialTemplate ${rows.length}건 복사`);
}

async function copyQuoteLineItemTemplates(realCompanyId, demoCompanyId) {
  const rows = await prisma.quoteLineItemTemplate.findMany({ where: { companyId: realCompanyId } });
  if (rows.length === 0) { console.log('· QuoteLineItemTemplate 0건'); return; }
  await prisma.quoteLineItemTemplate.createMany({
    data: rows.map((q) => ({
      companyId: demoCompanyId,
      workType: q.workType,
      itemName: q.itemName,
      spec: q.spec,
      unit: q.unit,
      defaultQuantity: q.defaultQuantity,
      defaultMaterialPrice: q.defaultMaterialPrice,
      defaultLaborPrice: q.defaultLaborPrice,
      defaultExpensePrice: q.defaultExpensePrice,
      active: q.active,
      orderIndex: q.orderIndex,
    })),
  });
  console.log(`✓ QuoteLineItemTemplate ${rows.length}건 복사`);
}

async function copyPhaseRules(realCompanyId, demoCompanyId) {
  const kw = await prisma.phaseKeywordRule.findMany({ where: { companyId: realCompanyId } });
  if (kw.length > 0) {
    await prisma.phaseKeywordRule.createMany({
      data: kw.map((r) => ({ companyId: demoCompanyId, keyword: r.keyword, phase: r.phase, active: r.active })),
      skipDuplicates: true,
    });
  }
  const dl = await prisma.phaseDeadlineRule.findMany({ where: { companyId: realCompanyId } });
  if (dl.length > 0) {
    await prisma.phaseDeadlineRule.createMany({
      data: dl.map((r) => ({ companyId: demoCompanyId, phase: r.phase, daysBefore: r.daysBefore, active: r.active })),
      skipDuplicates: true,
    });
  }
  const adv = await prisma.phaseAdvice.findMany({ where: { companyId: realCompanyId, ruleType: { not: 'UNCONFIRMED_CHECK' } } });
  if (adv.length > 0) {
    await prisma.phaseAdvice.createMany({
      data: adv.map((a) => ({
        companyId: demoCompanyId,
        phase: a.phase, ruleType: a.ruleType, daysBefore: a.daysBefore,
        title: a.title, description: a.description, category: a.category,
        requiresPhoto: a.requiresPhoto, active: a.active,
      })),
    });
  }
  const tips = await prisma.companyPhaseTip.findMany({ where: { companyId: realCompanyId } });
  if (tips.length > 0) {
    await prisma.companyPhaseTip.createMany({
      data: tips.map((t) => ({ companyId: demoCompanyId, phase: t.phase, body: t.body })),
      skipDuplicates: true,
    });
  }
  console.log(`✓ 공정 룰 복사: 키워드 ${kw.length} · 데드라인 ${dl.length} · 어드바이스 ${adv.length} · 가이드 ${tips.length}`);
}

async function copyAccountCodesAndRules(realCompanyId, demoCompanyId) {
  const codes = await prisma.accountCode.findMany({ where: { companyId: realCompanyId } });
  const codeIdMap = new Map();
  for (const c of codes) {
    const newC = await prisma.accountCode.create({
      data: {
        companyId: demoCompanyId,
        code: c.code, name: c.name, groupName: c.groupName,
        orderIndex: c.orderIndex, active: c.active,
      },
    });
    codeIdMap.set(c.id, newC.id);
  }
  const rules = await prisma.expenseCategoryRule.findMany({ where: { companyId: realCompanyId } });
  if (rules.length > 0) {
    await prisma.expenseCategoryRule.createMany({
      data: rules.map((r) => ({
        companyId: demoCompanyId,
        keyword: r.keyword,
        accountCodeId: r.accountCodeId ? codeIdMap.get(r.accountCodeId) : null,
        workCategory: r.workCategory,
        active: r.active,
      })),
    });
  }
  console.log(`✓ AccountCode ${codes.length} · ExpenseRule ${rules.length}`);
}

// ────────────────────────────────────────────────────────────
// 4. 서희 프로젝트 + 하위 변형 복사
// ────────────────────────────────────────────────────────────
async function copyProjectFromReal(source, demoCompanyId, ownerUserId, vendorMaps, demoCompany) {
  // 기존 동일 siteCode 데모 프로젝트 wipe
  const existing = await prisma.project.findFirst({
    where: { companyId: demoCompanyId, siteCode: DEMO_SITE_CODE },
  });
  if (existing) {
    await prisma.project.delete({ where: { id: existing.id } });
  }

  // 날짜 normalize — source 시작일을 오늘 기준으로 shift, 모든 날짜 필드 동일 offset 적용
  const offsetDays = computeShiftOffset(source.startDate);
  console.log(`  ↳ 날짜 shift offset: ${offsetDays}일 (source.startDate=${source.startDate?.toISOString?.().slice(0,10)} → ${shift(source.startDate, offsetDays)?.toISOString?.().slice(0,10)})`);

  const project = await prisma.project.create({
    data: {
      companyId: demoCompanyId,
      createdById: ownerUserId,
      name: DEMO_PROJECT_NAME,
      customerName: DEMO_CUSTOMER_NAME,
      customerPhone: DEMO_CUSTOMER_PHONE,
      siteAddress: DEMO_SITE_ADDRESS,
      area: source.area,
      siteCode: DEMO_SITE_CODE,
      startDate: shift(source.startDate, offsetDays),
      expectedEndDate: shift(source.expectedEndDate, offsetDays),
      actualEndDate: null, // IN_PROGRESS 강제 — 종료일 비움
      status: 'IN_PROGRESS', // 봉기님 결정 (2026-05-17): 데모는 항상 IN_PROGRESS
      contractAmount: source.contractAmount,
      doorPassword: DEMO_DOOR_PASSWORD,
      siteNotes: '데모용 가상 현장입니다. 일정은 오늘 기준으로 자동 갱신됩니다.',
    },
  });
  console.log(`✓ 프로젝트 생성 (status=IN_PROGRESS, area=${source.area}평)`);

  // 마감재
  const materialIdMap = new Map();
  for (const m of source.materials) {
    const newM = await prisma.material.create({
      data: {
        projectId: project.id,
        kind: m.kind,
        spaceGroup: m.spaceGroup,
        subgroup: m.subgroup,
        itemName: m.itemName,
        brand: m.brand,
        productName: m.productName,
        spec: m.spec,
        status: m.status,
        quantity: m.quantity,
        unit: m.unit,
        unitPrice: m.unitPrice,
        memo: m.memo,
        siteNotes: m.siteNotes,
        purchaseSource: m.purchaseSource,
        checked: m.checked,
        orderIndex: m.orderIndex,
        formKey: m.formKey,
        customSpec: m.customSpec,
        installed: m.installed,
        size: m.size,
        remarks: m.remarks,
      },
    });
    materialIdMap.set(m.id, newM.id);
  }
  console.log(`  ↳ 마감재 ${source.materials.length}건`);

  // 간편 견적 + 라인
  for (const q of source.simpleQuotes) {
    const newQ = await prisma.simpleQuote.create({
      data: {
        projectId: project.id,
        title: q.title,
        status: q.status,
        quoteDate: shift(q.quoteDate, offsetDays),
        sentAt: shift(q.sentAt, offsetDays),
        acceptedAt: shift(q.acceptedAt, offsetDays),
        supplierName: demoCompany.name,
        supplierRegNo: demoCompany.bizNumber,
        supplierOwner: demoCompany.representative,
        supplierAddress: demoCompany.address,
        supplierTel: demoCompany.phone,
        supplierEmail: demoCompany.email,
        supplierLogoUrl: demoCompany.logoUrl,
        clientName: DEMO_CUSTOMER_NAME,
        projectName: DEMO_PROJECT_NAME,
        designFeeRate: q.designFeeRate,
        vatRate: q.vatRate,
        roundAdjustment: q.roundAdjustment,
        subtotal: q.subtotal,
        designFeeAmount: q.designFeeAmount,
        vatAmount: q.vatAmount,
        total: q.total,
        footerNotes: q.footerNotes,
        templateKey: q.templateKey,
      },
    });
    if (q.lines && q.lines.length > 0) {
      await prisma.simpleQuoteLine.createMany({
        data: q.lines.map((l) => ({
          quoteId: newQ.id,
          orderIndex: l.orderIndex,
          isGroup: l.isGroup,
          isGroupEnd: l.isGroupEnd,
          itemName: l.itemName,
          spec: l.spec,
          unit: l.unit,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.amount,
          notes: l.notes,
        })),
      });
    }
  }
  console.log(`  ↳ 간편 견적 ${source.simpleQuotes.length}차 (라인 ${source.simpleQuotes.reduce((s, q) => s + (q.lines?.length || 0), 0)}건)`);

  // 일정 (날짜 shift)
  if (source.dailyScheduleEntries.length > 0) {
    await prisma.dailyScheduleEntry.createMany({
      data: source.dailyScheduleEntries.map((e) => ({
        projectId: project.id,
        date: shift(e.date, offsetDays),
        category: e.category,
        content: e.content,
        confirmed: e.confirmed,
        orderIndex: e.orderIndex,
        vendorId: e.vendorId ? vendorMaps.idMap.get(e.vendorId) || null : null,
        startTime: e.startTime,
        endTime: e.endTime,
      })),
    });
  }
  console.log(`  ↳ 일정 ${source.dailyScheduleEntries.length}건`);

  // 발주 (날짜 shift)
  for (const po of source.purchaseOrders) {
    await prisma.purchaseOrder.create({
      data: {
        projectId: project.id,
        materialId: po.materialId ? materialIdMap.get(po.materialId) || null : null,
        itemName: po.itemName,
        spec: po.spec,
        vendor: po.vendor ? (vendorMaps.nameMap.get(po.vendor) || po.vendor) : null,
        quantity: po.quantity,
        unit: po.unit,
        unitPrice: po.unitPrice,
        totalPrice: po.totalPrice,
        notes: po.notes,
        status: po.status,
        expectedDate: shift(po.expectedDate, offsetDays),
        orderedAt: shift(po.orderedAt, offsetDays),
        receivedAt: shift(po.receivedAt, offsetDays),
        materialChangedAt: shift(po.materialChangedAt, offsetDays),
      },
    });
  }
  console.log(`  ↳ 발주 ${source.purchaseOrders.length}건`);

  // 체크리스트 (날짜 shift)
  for (let i = 0; i < source.checklists.length; i++) {
    const c = source.checklists[i];
    await prisma.projectChecklist.create({
      data: {
        projectId: project.id,
        phase: c.phase,
        category: c.category,
        title: c.title,
        isDone: c.isDone,
        dueDate: shift(c.dueDate, offsetDays),
        completedAt: shift(c.completedAt, offsetDays),
        completedById: c.isDone ? ownerUserId : null,
        createdById: ownerUserId,
        orderIndex: c.orderIndex ?? i,
        requiresPhoto: c.requiresPhoto,
        team: c.team,
      },
    });
  }
  console.log(`  ↳ 체크리스트 ${source.checklists.length}건`);

  // 메모
  for (const m of source.projectMemos) {
    await prisma.projectMemo.create({
      data: {
        projectId: project.id,
        title: m.title,
        content: m.content,
        tag: m.tag,
        pinned: m.pinned,
        orderIndex: m.orderIndex,
      },
    });
  }
  console.log(`  ↳ 메모 ${source.projectMemos.length}건`);

  // 정산 메모
  for (const s of source.settlementNotes) {
    await prisma.projectSettlementNote.create({
      data: {
        projectId: project.id,
        phase: s.phase,
        body: s.body,
        updatedById: ownerUserId,
      },
    });
  }
  console.log(`  ↳ 정산 메모 ${source.settlementNotes.length}건`);

  // 견적 상담 메모 (phaseNotes)
  for (const n of source.phaseNotes) {
    await prisma.projectPhaseNote.create({
      data: {
        projectId: project.id,
        phase: n.phase,
        body: n.body,
        updatedById: ownerUserId,
      },
    });
  }
  console.log(`  ↳ 견적 상담 메모 ${source.phaseNotes.length}건`);
}

// ────────────────────────────────────────────────────────────
// 5. 라운지 글
// ────────────────────────────────────────────────────────────
async function seedLoungePosts(authorId) {
  let created = 0;
  for (const post of LOUNGE_POSTS) {
    const exists = await prisma.loungePost.findFirst({
      where: { authorId, title: post.title },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.loungePost.create({
      data: {
        authorId,
        category: post.category,
        title: post.title,
        body: post.body,
        bodyFormat: 'plain',
        showCompanyName: true,
        status: 'active',
      },
    });
    created++;
  }
  console.log(`✓ 라운지 글 ${created}/${LOUNGE_POSTS.length}건 신규`);
}

// ────────────────────────────────────────────────────────────
// main
// ────────────────────────────────────────────────────────────
async function main() {
  const email = (process.env.DEMO_OWNER_EMAIL || '').trim().toLowerCase();
  const password = process.env.DEMO_OWNER_PASSWORD || '';
  const ownerName = (process.env.DEMO_OWNER_NAME || '데모지기').trim();
  const nickname = (process.env.DEMO_OWNER_NICKNAME || '데모지기').trim();

  if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    console.error('❌ DEMO_OWNER_EMAIL 환경변수가 유효한 이메일이어야 합니다');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('❌ DEMO_OWNER_PASSWORD는 12자 이상이어야 합니다');
    process.exit(1);
  }

  console.log('═══════════════════════════════════════════');
  console.log('수플렉스 데모 계정 시드 — 리플레이스 디자인 서희아파트 변형 복사');
  console.log('═══════════════════════════════════════════\n');

  // 1. 데모 회사·OWNER·멤버십
  const demoCompany = await ensureDemoCompany();
  const user = await ensureOwner(email, password, ownerName, nickname);
  await ensureMembership(user.id, demoCompany.id);

  // 2. 시스템 프리셋 시드 (있으면 — 회사 자산 복사 전 베이스)
  const presetResult = await prisma.$transaction((tx) =>
    seedAllBundlesFromPresetIfAvailable(tx, { targetCompanyId: demoCompany.id })
  );
  if (presetResult.applied) {
    console.log(`✓ 시스템 프리셋 시드 (source=${presetResult.sourceCompanyId})`);
  } else {
    console.log('· 시스템 프리셋 표준 회사 없음 — skip');
  }

  // 3. 리플레이스 디자인 회사 찾기
  const realCompany = await findRealCompany();
  if (!realCompany) {
    console.warn(`⚠ "${REAL_COMPANY_NAME_LIKE}" 포함 회사 못 찾음 — 회사 자산·프로젝트 복사 skip`);
    await seedLoungePosts(user.id);
    return;
  }
  console.log(`✓ 실 회사 찾음: ${realCompany.name} (id=${realCompany.id})`);

  // 4. 회사 자산 wipe + 복사
  await wipeDemoAssets(demoCompany.id);
  const vendorMaps = await copyVendors(realCompany.id, demoCompany.id);
  await copyMaterialTemplates(realCompany.id, demoCompany.id);
  await copyQuoteLineItemTemplates(realCompany.id, demoCompany.id);
  await copyPhaseRules(realCompany.id, demoCompany.id);
  await copyAccountCodesAndRules(realCompany.id, demoCompany.id);

  // 5. 서희 프로젝트 찾기 + 변형 복사
  const sourceProject = await findSourceProject(realCompany.id);
  if (!sourceProject) {
    console.warn(`⚠ "${SOURCE_PROJECT_NAME_LIKE}" 포함 프로젝트 못 찾음 — 메인 프로젝트 시드 skip`);
  } else {
    console.log(`✓ 소스 프로젝트 찾음: ${sourceProject.name} (id=${sourceProject.id})`);
    await copyProjectFromReal(sourceProject, demoCompany.id, user.id, vendorMaps, demoCompany);
  }

  // 6. 라운지 글
  await seedLoungePosts(user.id);

  console.log('\n═══════════════════════════════════════════');
  console.log('시드 완료. 로그인:');
  console.log(`  회사:  ${demoCompany.name}`);
  console.log(`  이메일: ${email}`);
  console.log(`  비번:  DEMO_OWNER_PASSWORD 값`);
  console.log('═══════════════════════════════════════════');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
