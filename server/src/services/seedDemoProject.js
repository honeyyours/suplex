// 어드민 콘솔 — "데모 프로젝트 생성" 시드 로직.
// 메모리 핵심결정 "공정=척추" 시연용. 풍성한 4축(견적·마감재·일정·발주) 데이터로
// 공정 현황 표 + 공정 상세 드로어가 의미 있게 보이도록 구성.
// 같은 회사에 siteCode === DEMO_SITE_CODE 인 기존 데모는 삭제 후 재생성 (idempotent).

const DEMO_PROJECT_NAME = '데모 - 강남구 32평 아파트 리모델링';
const DEMO_SITE_CODE = 'DEMO_PROJECT';

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

async function seedDemoProject(prisma, { companyId, ownerUserId }) {
  // 1. 기존 데모 프로젝트 정리 (idempotent — 같은 회사 같은 siteCode 1개만)
  const existing = await prisma.project.findFirst({
    where: { companyId, siteCode: DEMO_SITE_CODE },
  });
  if (existing) {
    await prisma.project.delete({ where: { id: existing.id } });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = addDays(today, -5);
  const endDate = addDays(today, 40);

  // 회사 정보 (견적 공급자 스냅샷)
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  // 2. 프로젝트 생성
  const project = await prisma.project.create({
    data: {
      companyId,
      createdById: ownerUserId,
      name: DEMO_PROJECT_NAME,
      customerName: '박○○ 고객님',
      customerPhone: '010-1234-5678',
      siteAddress: '서울 강남구 테헤란로 123, 101동 502호',
      area: 32,
      siteCode: DEMO_SITE_CODE,
      startDate,
      expectedEndDate: endDate,
      status: 'IN_PROGRESS',
      doorPassword: '*1234',
      siteNotes:
        '엘리베이터 평일 09~18시 사용 가능. 관리실 02-555-1234.\n출입카드 받아 진행. 주차 2대 가능 (지하 1층).',
    },
  });

  // 3. 간편 견적 (1차 DRAFT) + 라인 (그룹 11개 × 라인 1~3개)
  const quote = await prisma.simpleQuote.create({
    data: {
      projectId: project.id,
      title: '1차',
      status: 'DRAFT',
      quoteDate: today,
      supplierName: company?.name || '데모 인테리어',
      supplierRegNo: company?.bizNumber || null,
      supplierOwner: company?.representative || null,
      supplierAddress: company?.address || null,
      supplierTel: company?.phone || null,
      supplierEmail: company?.email || null,
      supplierLogoUrl: company?.logoUrl || null,
      clientName: '박○○ 고객님',
      projectName: DEMO_PROJECT_NAME,
      designFeeRate: 10,
      vatRate: 0,
      footerNotes:
        '1. 위 견적은 가견적서이므로 실제 디자인 계약 내용에 따라 금액이 달라질 수 있습니다.\n2. 현금영수증 및 세금계산서 발행시 부가세(10%) 별도이며 견적 외 공사는 추가금이 발생됩니다.',
    },
  });

  const groups = [
    { phase: '시작',                lines: [['보양·자재반입',     '식', 1, 800000]] },
    { phase: '철거',                lines: [['철거 일식',         '식', 1, 4500000], ['폐기물 처리',       '식', 1, 800000]] },
    { phase: '단열',                lines: [['PE보온재 시공',     '식', 1, 1200000]] },
    { phase: '설비',                lines: [['배관 교체',         '식', 1, 2500000], ['도시가스 이설',     '식', 1, 600000]] },
    { phase: '전기',                lines: [['회로 점검·증설',    '식', 1, 2200000], ['콘센트/스위치 교체','식', 1, 800000]] },
    { phase: '목공',                lines: [['목공 골조',         '식', 1, 5800000], ['우물천장',          '식', 1, 1200000], ['아트월', '식', 1, 800000]] },
    { phase: '타일',                lines: [['욕실 벽·바닥 타일', '식', 1, 4500000], ['주방 타일',         '식', 1, 1200000]] },
    { phase: '욕실',                lines: [['도기·수전 셋트',    '식', 1, 2800000], ['거울/조명',         '식', 1, 600000]] },
    { phase: '도배',                lines: [['실크벽지 일식',     '식', 1, 3200000]] },
    { phase: '마루·장판',            lines: [['강마루 32평',       '식', 1, 5800000]] },
    { phase: '마무리(점검, 실리콘)', lines: [['실리콘·점검 일식', '식', 1, 600000]] },
  ];

  let order = 0;
  let subtotal = 0;
  const lineData = [];
  for (const g of groups) {
    lineData.push({
      quoteId: quote.id,
      orderIndex: order++,
      isGroup: true,
      isGroupEnd: false,
      itemName: g.phase,
      quantity: 0,
      unitPrice: 0,
      amount: 0,
    });
    for (const [itemName, unit, quantity, unitPrice] of g.lines) {
      const amount = quantity * unitPrice;
      subtotal += amount;
      lineData.push({
        quoteId: quote.id,
        orderIndex: order++,
        isGroup: false,
        isGroupEnd: false,
        itemName,
        unit,
        quantity,
        unitPrice,
        amount,
      });
    }
  }
  await prisma.simpleQuoteLine.createMany({ data: lineData });

  const designFeeAmount = Math.round(subtotal * 0.10);
  const total = subtotal + designFeeAmount;
  await prisma.simpleQuote.update({
    where: { id: quote.id },
    data: { subtotal, designFeeAmount, vatAmount: 0, total },
  });

  // 4. 마감재 (FINISH) — spaceGroup이 표준 phase 라벨이어야 매칭됨.
  // 의도적으로 UNDECIDED 다수 + 임박 D-N 케이스 두어 리스크 배지 트리거.
  // 수량/단위/비고를 채워 마감재 → 발주 자동 전파 흐름이 시연되도록.
  // 컬럼: spaceGroup, itemName, brand, productName, status, quantity, unit, memo
  const materials = [
    ['단열',       '단열재 PE보온재',            '한일이화',     'PE 30T',                          'UNDECIDED', 32,  '평',    null],
    ['전기',       '거실 매입등 LED',            '오스람',       'LED 20W 다운라이트 6인치',        'CONFIRMED', 12,  '개',    '3000K 전구색'],
    ['전기',       '침실 시스템에어컨 콘센트',   'LS산전',        null,                              'REVIEWING', 3,   '구',    null],
    ['목공',       '우물천장 자재',              'KCC',          '석고보드 9.5T + MDF 12T',         'CONFIRMED', 1,   '식',    '거실 우물천장 사이즈 2.4×3.6m 기준'],
    ['목공',       '거실 아트월',                '자작합판',      null,                              'REVIEWING', 1,   '식',    '아트월 폭 3.6m, 우드 톤 샘플 확인 필요'],
    ['타일',       '욕실 벽 타일',               '유로세라믹',    'TIMELESS WHITE 300x600',          'CONFIRMED', 24,  '박스',  '색상: 화이트 / 코너 마감재 별도 주문'],
    ['타일',       '욕실 바닥 타일',             '유로세라믹',    'TERRA GREY 300x300',              'CONFIRMED', 16,  '박스',  '색상: 그레이 / 논슬립'],
    ['타일',       '주방 타일',                  '동신타일',      'URBAN STONE BEIGE 600x600',       'UNDECIDED', 8,   '박스',  '색상 베이지/그레이 중 선택'],
    ['욕실',       '양변기',                     '대림바스',      'DC-1700S',                        'CONFIRMED', 2,   '대',    '비데 일체형'],
    ['욕실',       '세면대',                     '대림바스',      'C-7100SM',                        'CONFIRMED', 2,   '대',    '카운터 매립형'],
    ['욕실',       '샤워수전',                   '더죤',          'DJ-200CR',                        'CHANGED',   2,   '셋트',  '크롬 → 매트블랙으로 변경'],
    ['욕실',       '욕실 거울',                  null,            '600x800 LED 매립형',              'UNDECIDED', 2,   '개',    null],
    ['도배',       '거실 실크벽지',              'LG하우시스',    'LX월 베니션 화이트',              'CONFIRMED', 14,  '롤',    '거실+주방 통일'],
    ['도배',       '침실 실크벽지',              '신한벽지',      null,                              'UNDECIDED', 8,   '롤',    null],
    ['마루·장판',  '강마루',                     '동화자연마루',  '나투스진 카르마',                  'REUSED',    32,  '평',    '마루 보양 시트 별도 / 기존 평탄도 확인'],
  ];

  const materialByName = {};
  let mOrder = 0;
  for (const [spaceGroup, itemName, brand, productName, status, quantity, unit, memo] of materials) {
    const m = await prisma.material.create({
      data: {
        projectId: project.id,
        kind: 'FINISH',
        spaceGroup,
        itemName,
        brand,
        productName,
        status,
        quantity,
        unit,
        memo,
        orderIndex: mOrder++,
      },
    });
    materialByName[itemName] = m;
  }

  // 5. 일정 entries — category가 표준 phase 라벨이어야 공정 현황에서 잡힘.
  // [phase, content, dayOffsetFromStart]
  const schedules = [
    ['시작',                 '보양 / 자재반입',                 0],
    ['철거',                 '거실·주방 철거 시작',             1],
    ['철거',                 '욕실·침실 철거',                  2],
    ['철거',                 '폐기물 차량 반출',                3],
    ['설비',                 '배관 라인 점검·교체',             3],
    ['설비',                 '도시가스 이설 작업',              5],
    ['전기',                 '회로 점검·증설',                  4],
    ['전기',                 '콘센트/스위치 위치 표시',         7],
    ['단열',                 '외벽 단열재 시공',                5],
    ['단열',                 '베란다 단열 마감',                7],
    ['목공',                 '천장 골조 시작',                  8],
    ['목공',                 '우물천장 작업',                   10],
    ['목공',                 '거실 아트월 작업',                12],
    ['목공',                 '주방 가벽 작업',                  13],
    ['목공',                 '문틀 시공',                       14],
    ['목공',                 '드레스룸 시공',                   15],
    ['목공',                 '걸레받이 시공',                   16],
    ['목공',                 '몰딩 마감',                       17],
    ['타일',                 '욕실 벽·바닥 타일',               18],
    ['타일',                 '욕실 타일 줄눈 작업',             20],
    ['타일',                 '주방 타일',                       21],
    ['타일',                 '현관 타일',                       22],
    ['욕실',                 '도기·수전 설치',                  23],
    ['욕실',                 '욕실 거울·조명 설치',             25],
    ['도배',                 '거실·주방 도배',                  26],
    ['도배',                 '침실 도배',                       28],
    ['마루·장판',            '강마루 시공',                     31],
    ['마루·장판',            '걸레받이 마무리',                 33],
    ['마무리(점검, 실리콘)', '실리콘 작업',                    39],
    ['마무리(점검, 실리콘)', '전체 점검',                       41],
    ['입주청소',             '입주청소',                        43],
  ];

  const scheduleData = schedules.map(([category, content, dayOffset], i) => {
    const date = addDays(startDate, dayOffset);
    return {
      projectId: project.id,
      date,
      category,
      content,
      confirmed: date < today, // 과거는 확정 ✓, 미래는 미확정
      orderIndex: i,
    };
  });
  await prisma.dailyScheduleEntry.createMany({ data: scheduleData });

  // 6. 발주 (PurchaseOrder) — materialId 연결로 공정 매칭됨.
  // [materialName, status, expectedDayOffset, receivedDayOffset(optional), totalPrice, vendor, materialChanged?]
  const orders = [
    ['거실 매입등 LED',   'RECEIVED', 1,  6,    1500000, '오스람코리아',            false],
    ['우물천장 자재',     'RECEIVED', 5,  9,    850000,  'KCC 강남',                false],
    ['욕실 벽 타일',      'ORDERED',  10, null, 1800000, '유로세라믹 강남대리점',   false],
    ['욕실 바닥 타일',    'ORDERED',  10, null, 1200000, '유로세라믹 강남대리점',   false],
    ['양변기',            'PENDING',  18, null, 450000,  '대림바스',                false],
    ['세면대',            'PENDING',  18, null, 280000,  '대림바스',                false],
    ['샤워수전',          'ORDERED',  18, null, 320000,  '더죤 본사',               true],
    ['거실 실크벽지',     'PENDING',  22, null, 1100000, 'LG하우시스 자재상',       false],
    ['강마루',            'PENDING',  27, null, 4200000, '동화자연마루 본사',       false],
  ];

  for (const [matName, status, expectedDayOffset, receivedDayOffset, totalPrice, vendor, materialChanged] of orders) {
    const m = materialByName[matName];
    if (!m) continue;
    const expectedDate = addDays(startDate, expectedDayOffset);
    const orderedAt =
      status === 'ORDERED' || status === 'RECEIVED'
        ? addDays(startDate, Math.max(0, expectedDayOffset - 2))
        : null;
    const receivedAt =
      status === 'RECEIVED' && receivedDayOffset != null ? addDays(startDate, receivedDayOffset) : null;

    // 실제 운영의 마감재→발주 자동 흐름과 동일한 모양으로 시드 (materials.routes.js
    // buildPOFromMaterial과 일관). spec은 brand/productName 합쳐 표시, 비고는 PO.notes로.
    const specParts = [];
    if (m.brand) specParts.push(m.brand);
    if (m.productName) specParts.push(m.productName);
    const spec = specParts.length ? specParts.join(' / ') : null;

    await prisma.purchaseOrder.create({
      data: {
        projectId: project.id,
        materialId: m.id,
        itemName: `${m.spaceGroup} · ${m.itemName}`,
        spec,
        vendor,
        quantity: m.quantity,
        unit: m.unit,
        unitPrice: totalPrice,
        totalPrice,
        notes: m.memo || null,
        status,
        expectedDate,
        orderedAt,
        receivedAt,
        materialChangedAt: materialChanged ? new Date() : null,
      },
    });
  }

  // 7. 체크리스트
  const checklists = [
    ['시작',                 'GENERAL', '보양 관련 관리실 문의',          true,  -3],
    ['시작',                 'GENERAL', '엘리베이터 사용시간 안내문 부착', true,  0],
    ['철거',                 'GENERAL', '철거 폐기물 차량 진입 동선 점검', true,  -1],
    ['단열',                 'GENERAL', '단열재 도착 확인',                true,  4],
    ['도배',                 'GENERAL', '도배 풀 종류 확인',               false, 23],
    ['마루·장판',            'GENERAL', '마루 시공 전 평탄도 확인',        false, 30],
    ['입주청소',             'GENERAL', '가전 사이즈 재확인',              false, 36],
  ];
  for (let i = 0; i < checklists.length; i++) {
    const [phase, category, title, isDone, dueOffset] = checklists[i];
    const dueDate = addDays(startDate, dueOffset);
    await prisma.projectChecklist.create({
      data: {
        projectId: project.id,
        phase,
        category,
        title,
        isDone,
        dueDate,
        completedAt: isDone ? dueDate : null,
        completedById: isDone ? ownerUserId : null,
        createdById: ownerUserId,
        orderIndex: i,
      },
    });
  }

  // 8. 메모
  await prisma.projectMemo.create({
    data: {
      projectId: project.id,
      title: '고객 선호 톤',
      content:
        '박○○ 고객님 - 거실 아트월 우드 톤 선호. 실크벽지 베이지 계열로 제안.\n주방은 화이트 + 그레이 조합 원함.\n시공 사진 카톡 공유 원함.',
      tag: '일반',
      pinned: true,
      orderIndex: 0,
    },
  });
  await prisma.projectMemo.create({
    data: {
      projectId: project.id,
      title: '철거 회고',
      content:
        '철거 D+2일 - 인터폰 미리 점검 필요 (지난 현장에서 빠짐).\n주방 가스 차단 확인 필수.',
      tag: '회고',
      pinned: false,
      orderIndex: 1,
    },
  });

  return {
    projectId: project.id,
    quoteId: quote.id,
    counts: {
      quoteLines: lineData.length,
      materials: materials.length,
      schedules: schedules.length,
      purchaseOrders: orders.length,
      checklists: checklists.length,
      memos: 2,
    },
  };
}

module.exports = { seedDemoProject, DEMO_PROJECT_NAME, DEMO_SITE_CODE };
