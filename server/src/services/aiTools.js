// AI비서용 read-only 쿼리 도구 모음
// Claude한테 JSON Schema로 노출하고, 실행은 회사ID로 강제 필터링.
const prisma = require('../config/prisma');

const WORK_TYPES = [
  'START', 'DEMOLITION', 'PLUMBING', 'GAS', 'ELECTRIC', 'FIRE',
  'CARPENTRY', 'TILE', 'BATHROOM', 'PAINTING', 'FILM', 'WALLPAPER',
  'FURNITURE', 'FLOORING', 'FINISHING',
];
const EXPENSE_TYPES = ['EXPENSE', 'INCOME', 'TRANSFER'];

// Decimal/Date → JSON-friendly
function n(v) {
  if (v == null) return null;
  return Number(v);
}
function d(v) {
  if (!v) return null;
  return new Date(v).toISOString().slice(0, 10);
}

// ============================================
// Tool: search_projects
// ============================================
const search_projects = {
  schema: {
    name: 'search_projects',
    description: '프로젝트 검색. 이름·고객명·주소에서 부분일치, 상태 필터. 사용자가 프로젝트 이름을 언급하면 가장 먼저 호출해서 ID를 얻으세요.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '이름/고객/주소 부분 검색어 (선택)' },
        status: {
          type: 'string',
          enum: ['PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
          description: '프로젝트 상태 필터 (선택)',
        },
      },
    },
  },
  async run({ companyId }, args) {
    const where = { companyId };
    if (args.status) where.status = args.status;
    if (args.query) {
      where.OR = [
        { name: { contains: args.query, mode: 'insensitive' } },
        { customerName: { contains: args.query, mode: 'insensitive' } },
        { siteAddress: { contains: args.query, mode: 'insensitive' } },
      ];
    }
    const rows = await prisma.project.findMany({
      where,
      select: {
        id: true, name: true, siteCode: true, customerName: true, siteAddress: true,
        status: true, area: true, contractAmount: true,
        startDate: true, expectedEndDate: true, actualEndDate: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      siteCode: r.siteCode,
      customerName: r.customerName,
      siteAddress: r.siteAddress,
      status: r.status,
      area: n(r.area),
      contractAmount: n(r.contractAmount),
      startDate: d(r.startDate),
      expectedEndDate: d(r.expectedEndDate),
      actualEndDate: d(r.actualEndDate),
    }));
  },
};

// ============================================
// Tool: get_project_summary
// ============================================
const get_project_summary = {
  schema: {
    name: 'get_project_summary',
    description: '한 프로젝트의 전체 요약: 계약/지출/수익/마감재 현황/견적 수/일정 수. 손익 분석 시 사용.',
    input_schema: {
      type: 'object',
      properties: { projectId: { type: 'string', description: '프로젝트 ID (search_projects로 먼저 찾으세요)' } },
      required: ['projectId'],
    },
  },
  async run({ companyId }, args) {
    const project = await prisma.project.findFirst({
      where: { id: args.projectId, companyId },
    });
    if (!project) return { error: '프로젝트를 찾을 수 없거나 접근 권한이 없습니다' };

    const [expenseAgg, materialGroups, quotesCount, scheduleCount, lastQuote] = await Promise.all([
      prisma.expense.aggregate({
        where: { projectId: project.id },
        _sum: { amount: true }, _count: true,
      }),
      prisma.material.groupBy({
        by: ['status'],
        where: { projectId: project.id },
        _count: true,
      }),
      prisma.quote.count({ where: { projectId: project.id } }),
      prisma.dailyScheduleEntry.count({ where: { projectId: project.id } }),
      prisma.quote.findFirst({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, totalFinal: true, totalSupply: true, status: true, createdAt: true },
      }),
    ]);

    const totalExpense = Number(expenseAgg._sum.amount || 0);
    const contract = Number(project.contractAmount || 0);
    const profit = contract - totalExpense;
    const margin = contract > 0 ? (profit / contract) * 100 : null;
    const matStatusMap = {};
    for (const g of materialGroups) matStatusMap[g.status] = g._count;

    return {
      id: project.id,
      name: project.name,
      customerName: project.customerName,
      siteAddress: project.siteAddress,
      status: project.status,
      area: n(project.area),
      contractAmount: contract,
      totalExpense,
      profit,
      margin: margin != null ? Math.round(margin * 100) / 100 : null,
      expenseCount: expenseAgg._count,
      materialCounts: matStatusMap,
      quotesCount,
      scheduleEntriesCount: scheduleCount,
      lastQuote: lastQuote ? {
        id: lastQuote.id,
        title: lastQuote.title,
        status: lastQuote.status,
        totalSupply: n(lastQuote.totalSupply),
        totalFinal: n(lastQuote.totalFinal),
        createdAt: lastQuote.createdAt.toISOString(),
      } : null,
      startDate: d(project.startDate),
      expectedEndDate: d(project.expectedEndDate),
    };
  },
};

// ============================================
// Tool: list_expenses
// ============================================
function buildExpenseWhere({ companyId }, args) {
  const where = { companyId };
  if (args.projectId === 'NONE') where.projectId = null;
  else if (args.projectId) where.projectId = args.projectId;
  if (args.type && EXPENSE_TYPES.includes(args.type)) where.type = args.type;
  // 계정과목: 정확 매칭 또는 부분 매칭
  if (args.accountCode || args.accountCodeContains) {
    where.accountCode = {};
    if (args.accountCode) where.accountCode.code = args.accountCode;
    if (args.accountCodeContains) {
      where.accountCode.code = { contains: args.accountCodeContains, mode: 'insensitive' };
    }
  }
  if (args.accountGroup) where.accountCode = { ...(where.accountCode || {}), groupName: args.accountGroup };
  if (args.workCategory) where.workCategory = { contains: args.workCategory, mode: 'insensitive' };
  if (args.vendor) where.vendor = { contains: args.vendor, mode: 'insensitive' };
  if (args.dateFrom || args.dateTo) {
    where.date = {};
    if (args.dateFrom) where.date.gte = new Date(args.dateFrom);
    if (args.dateTo) where.date.lte = new Date(args.dateTo);
  }
  if (args.q) {
    where.OR = [
      { description: { contains: args.q, mode: 'insensitive' } },
      { vendor: { contains: args.q, mode: 'insensitive' } },
    ];
  }
  return where;
}

const list_expenses = {
  schema: {
    name: 'list_expenses',
    description: '지출/매출 트랜잭션 목록 조회 (최대 100건). 합계만 필요하면 sum_expenses 사용. type=EXPENSE(지출)/INCOME(매출)/TRANSFER(자금이체).',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: '프로젝트 ID. "NONE"으로 현장미지정(본사) 만' },
        type: { type: 'string', enum: EXPENSE_TYPES, description: '거래 종류 (기본: 모두)' },
        accountCode: { type: 'string', description: '정확한 계정과목 코드 (예: "[현장] 자재비")' },
        accountCodeContains: { type: 'string', description: '계정과목 부분 일치 (예: "자재비"로 [현장] 자재비 매칭)' },
        accountGroup: { type: 'string', description: '계정 그룹 (본사/현장/대표/매출/자금/기타)' },
        workCategory: { type: 'string', description: '공종 부분일치 (예: "전기")' },
        dateFrom: { type: 'string', description: 'YYYY-MM-DD' },
        dateTo: { type: 'string', description: 'YYYY-MM-DD' },
        vendor: { type: 'string', description: '거래처 부분일치' },
        q: { type: 'string', description: '내역/거래처 검색어' },
      },
    },
  },
  async run(ctx, args) {
    const where = buildExpenseWhere(ctx, args);
    const rows = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 100,
      include: {
        project: { select: { name: true } },
        accountCode: { select: { code: true, groupName: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      date: d(r.date),
      amount: n(r.amount),
      type: r.type,
      account: r.accountCode?.code || null,
      accountGroup: r.accountCode?.groupName || null,
      workCategory: r.workCategory,
      vendor: r.vendor,
      description: r.description,
      paymentMethod: r.paymentMethod,
      project: r.project?.name || '(미지정)',
    }));
  },
};

// ============================================
// Tool: sum_expenses
// ============================================
const sum_expenses = {
  schema: {
    name: 'sum_expenses',
    description: '거래 합계/건수 집계. type=EXPENSE 기본(지출만). groupBy로 계정/거래처/프로젝트별 분석. "이번달 자재비 총합" → accountCodeContains="자재비" + dateFrom/dateTo.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        type: { type: 'string', enum: EXPENSE_TYPES, description: '기본 EXPENSE (지출만)' },
        accountCode: { type: 'string', description: '정확한 계정과목' },
        accountCodeContains: { type: 'string', description: '계정과목 부분일치 (자주 사용 — 예: "자재비")' },
        accountGroup: { type: 'string', description: '계정 그룹 (본사/현장/대표/매출/자금/기타)' },
        workCategory: { type: 'string', description: '공종 부분일치' },
        dateFrom: { type: 'string', description: 'YYYY-MM-DD' },
        dateTo: { type: 'string', description: 'YYYY-MM-DD' },
        vendor: { type: 'string' },
        q: { type: 'string' },
        groupBy: {
          type: 'string',
          enum: ['accountCode', 'accountGroup', 'vendor', 'project', 'workCategory', 'paymentMethod', 'type', 'month'],
          description: '그룹별 합계가 필요하면 지정',
        },
      },
    },
  },
  async run(ctx, args) {
    // type 기본 EXPENSE
    if (!args.type) args = { ...args, type: 'EXPENSE' };
    const where = buildExpenseWhere(ctx, args);
    const totalAgg = await prisma.expense.aggregate({
      where, _sum: { amount: true }, _count: true,
    });
    const result = {
      total: Number(totalAgg._sum.amount || 0),
      count: totalAgg._count,
    };
    if (args.groupBy) {
      // accountCode/accountGroup은 raw query (relation 그룹핑)
      if (args.groupBy === 'accountCode' || args.groupBy === 'accountGroup') {
        const field = args.groupBy === 'accountCode' ? 'ac.code' : 'ac."groupName"';
        const rows = await prisma.expense.findMany({
          where,
          select: { amount: true, accountCode: { select: { code: true, groupName: true } } },
        });
        const m = new Map();
        for (const r of rows) {
          const key = args.groupBy === 'accountCode'
            ? (r.accountCode?.code || '(미지정)')
            : (r.accountCode?.groupName || '(미지정)');
          if (!m.has(key)) m.set(key, { total: 0, count: 0 });
          m.get(key).total += Number(r.amount);
          m.get(key).count += 1;
        }
        result.groups = [...m.entries()]
          .map(([key, v]) => ({ key, ...v }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 30);
      } else if (args.groupBy === 'month') {
        const rows = await prisma.expense.findMany({
          where, select: { amount: true, date: true },
        });
        const m = new Map();
        for (const r of rows) {
          const key = String(r.date).slice(0, 7); // YYYY-MM
          if (!m.has(key)) m.set(key, { total: 0, count: 0 });
          m.get(key).total += Number(r.amount);
          m.get(key).count += 1;
        }
        result.groups = [...m.entries()]
          .map(([key, v]) => ({ key, ...v }))
          .sort((a, b) => a.key.localeCompare(b.key));
      } else {
        const fieldMap = {
          vendor: 'vendor',
          project: 'projectId',
          workCategory: 'workCategory',
          paymentMethod: 'paymentMethod',
          type: 'type',
        };
        const field = fieldMap[args.groupBy];
        const groups = await prisma.expense.groupBy({
          by: [field], where,
          _sum: { amount: true }, _count: true,
          orderBy: { _sum: { amount: 'desc' } },
          take: 30,
        });
        let projectMap = {};
        if (args.groupBy === 'project') {
          const projectIds = groups.map((g) => g.projectId).filter(Boolean);
          if (projectIds.length > 0) {
            const projects = await prisma.project.findMany({
              where: { id: { in: projectIds } },
              select: { id: true, name: true },
            });
            projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
          }
        }
        result.groups = groups.map((g) => ({
          key: args.groupBy === 'project'
            ? (g.projectId ? projectMap[g.projectId] || g.projectId : '(미지정)')
            : (g[field] || '(없음)'),
          total: Number(g._sum.amount || 0),
          count: g._count,
        }));
      }
    }
    return result;
  },
};

// ============================================
// Tool: list_account_codes (회사 계정과목 마스터 조회)
// ============================================
const list_account_codes = {
  schema: {
    name: 'list_account_codes',
    description: '회사의 계정과목 마스터 목록. 사용자 회사가 어떤 계정 체계 쓰는지 확인할 때 사용.',
    input_schema: {
      type: 'object',
      properties: {
        groupName: { type: 'string', description: '특정 그룹만 (본사/현장/대표/매출/자금/기타)' },
      },
    },
  },
  async run({ companyId }, args) {
    const where = { companyId, active: true };
    if (args.groupName) where.groupName = args.groupName;
    const codes = await prisma.accountCode.findMany({
      where,
      orderBy: [{ groupName: 'asc' }, { orderIndex: 'asc' }],
    });
    return codes.map((c) => ({
      id: c.id,
      code: c.code,
      group: c.groupName,
    }));
  },
};

// ============================================
// Tool: list_materials
// ============================================
const list_materials = {
  schema: {
    name: 'list_materials',
    description: '마감재(또는 가전·가구) 목록. 항목명·브랜드·제품명에서 부분일치 검색. "장판 얼마였어" 같은 질문에 사용.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        kind: { type: 'string', enum: ['FINISH', 'APPLIANCE'] },
        status: { type: 'string', enum: ['UNDECIDED', 'REVIEWING', 'CONFIRMED', 'CHANGED'] },
        search: { type: 'string', description: '항목명/브랜드/제품명/공간 부분일치' },
      },
    },
  },
  async run({ companyId }, args) {
    const where = { project: { companyId } };
    if (args.projectId) where.projectId = args.projectId;
    if (args.kind) where.kind = args.kind;
    if (args.status) where.status = args.status;
    if (args.search) {
      where.OR = [
        { itemName: { contains: args.search, mode: 'insensitive' } },
        { brand: { contains: args.search, mode: 'insensitive' } },
        { productName: { contains: args.search, mode: 'insensitive' } },
        { spaceGroup: { contains: args.search, mode: 'insensitive' } },
      ];
    }
    const rows = await prisma.material.findMany({
      where,
      orderBy: [{ kind: 'asc' }, { spaceGroup: 'asc' }, { orderIndex: 'asc' }],
      take: 100,
      include: { project: { select: { name: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      spaceGroup: r.spaceGroup,
      itemName: r.itemName,
      brand: r.brand,
      productName: r.productName,
      spec: r.spec,
      status: r.status,
      checked: r.checked,
      quantity: n(r.quantity),
      unit: r.unit,
      unitPrice: n(r.unitPrice),
      totalPrice: n(r.totalPrice),
      purchaseSource: r.purchaseSource,
      project: r.project.name,
    }));
  },
};

// ============================================
// Tool: list_purchase_orders
// ============================================
const list_purchase_orders = {
  schema: {
    name: 'list_purchase_orders',
    description: '발주예정 목록. 마감재 확정→자동 생성된 것 + 즉흥 발주 모두.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        status: { type: 'string', enum: ['PENDING', 'ORDERED', 'RECEIVED', 'CANCELLED'] },
      },
    },
  },
  async run({ companyId }, args) {
    const where = { project: { companyId } };
    if (args.projectId) where.projectId = args.projectId;
    if (args.status) where.status = args.status;
    const rows = await prisma.purchaseOrder.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      include: { project: { select: { name: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      itemName: r.itemName,
      spec: r.spec,
      vendor: r.vendor,
      quantity: n(r.quantity),
      unit: r.unit,
      unitPrice: n(r.unitPrice),
      totalPrice: n(r.totalPrice),
      status: r.status,
      expectedDate: d(r.expectedDate),
      orderedAt: d(r.orderedAt),
      receivedAt: d(r.receivedAt),
      project: r.project.name,
    }));
  },
};

// ============================================
// Tool: list_quotes
// ============================================
const list_quotes = {
  schema: {
    name: 'list_quotes',
    description: '견적 목록 (버전별). 공급가액/합계/평당단가 등 견적 분석.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        status: { type: 'string', enum: ['DRAFT', 'SENT', 'FINAL'] },
      },
    },
  },
  async run({ companyId }, args) {
    const where = { project: { companyId } };
    if (args.projectId) where.projectId = args.projectId;
    if (args.status) where.status = args.status;
    const rows = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { project: { select: { name: true, area: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      project: r.project.name,
      area: n(r.area || r.project.area),
      totalDirect: n(r.totalDirect),
      totalSupply: n(r.totalSupply),
      totalVat: n(r.totalVat),
      totalFinal: n(r.totalFinal),
      pricePerPyeong: r.area && Number(r.area) > 0 ? Math.round(Number(r.totalDirect) / Number(r.area)) : null,
      createdAt: r.createdAt.toISOString(),
    }));
  },
};

// ============================================
// Tool: list_schedules (일별 공정 일정)
// ============================================
const list_schedules = {
  schema: {
    name: 'list_schedules',
    description: '프로젝트의 일별 공정 일정 조회. 날짜 범위 필터 가능. 기본 날짜 내림차순(최근 일정 먼저). "마지막 일정", "다음 작업", "이번 주 일정" 같은 질문에 사용.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string', description: '프로젝트 ID (필수 권장 — 미지정 시 모든 프로젝트의 일정 섞임)' },
        dateFrom: { type: 'string', description: 'YYYY-MM-DD 시작일' },
        dateTo: { type: 'string', description: 'YYYY-MM-DD 종료일' },
        confirmedOnly: { type: 'boolean', description: '확정된 일정만 (기본 false)' },
        order: { type: 'string', enum: ['asc', 'desc'], description: '날짜 정렬 (기본 desc — 최근 먼저)' },
        limit: { type: 'number', description: '최대 건수 (기본 100, 최대 200)' },
      },
    },
  },
  async run({ companyId }, args) {
    const where = { project: { companyId } };
    if (args.projectId) where.projectId = args.projectId;
    if (args.confirmedOnly) where.confirmed = true;
    if (args.dateFrom || args.dateTo) {
      where.date = {};
      if (args.dateFrom) where.date.gte = new Date(args.dateFrom);
      if (args.dateTo) where.date.lte = new Date(args.dateTo);
    }
    const limit = Math.min(Number(args.limit) || 100, 200);
    const order = args.order === 'asc' ? 'asc' : 'desc';

    const rows = await prisma.dailyScheduleEntry.findMany({
      where,
      orderBy: [{ date: order }, { orderIndex: 'asc' }],
      take: limit,
      include: { project: { select: { name: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      date: d(r.date),
      content: r.content,
      category: r.category,
      confirmed: r.confirmed,
      project: r.project.name,
    }));
  },
};

// ============================================
// Tool: list_checklists
// ============================================
const list_checklists = {
  schema: {
    name: 'list_checklists',
    description: '프로젝트 체크리스트 항목 조회. 미완료 항목, 카테고리별 필터 가능.',
    input_schema: {
      type: 'object',
      properties: {
        projectId: { type: 'string' },
        isDone: { type: 'boolean', description: 'true=완료 / false=미완 (기본 둘다)' },
        category: {
          type: 'string',
          enum: ['GENERAL', 'CLIENT_REQUEST', 'DESIGN_TO_FIELD', 'TOUCH_UP', 'URGENT'],
        },
      },
    },
  },
  async run({ companyId }, args) {
    const where = { project: { companyId } };
    if (args.projectId) where.projectId = args.projectId;
    if (args.isDone !== undefined) where.isDone = args.isDone;
    if (args.category) where.category = args.category;
    const rows = await prisma.projectChecklist.findMany({
      where,
      orderBy: [{ isDone: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      include: { project: { select: { name: true } } },
    });
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      isDone: r.isDone,
      completedAt: r.completedAt ? r.completedAt.toISOString() : null,
      dueDate: d(r.dueDate),
      project: r.project.name,
    }));
  },
};

// ============================================
// Tool: get_pnl_summary
// ============================================
const get_pnl_summary = {
  schema: {
    name: 'get_pnl_summary',
    description: '회사 전체 손익 요약 (이번달/전월/누적 + 모든 프로젝트 PnL). "수익률 낮은 현장" 같은 횡단 질문에 사용.',
    input_schema: { type: 'object', properties: {} },
  },
  async run({ companyId }) {
    const now = new Date();
    const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
    const startNext = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonth, prevMonth, all, projects, expGroup] = await Promise.all([
      prisma.expense.aggregate({
        where: { companyId, date: { gte: startThis, lt: startNext } },
        _sum: { amount: true }, _count: true,
      }),
      prisma.expense.aggregate({
        where: { companyId, date: { gte: startPrev, lt: startThis } },
        _sum: { amount: true }, _count: true,
      }),
      prisma.expense.aggregate({
        where: { companyId },
        _sum: { amount: true }, _count: true,
      }),
      prisma.project.findMany({
        where: { companyId },
        select: { id: true, name: true, status: true, contractAmount: true },
      }),
      prisma.expense.groupBy({
        by: ['projectId'],
        where: { companyId, projectId: { not: null } },
        _sum: { amount: true },
      }),
    ]);

    const expByProject = new Map(expGroup.map((g) => [g.projectId, Number(g._sum.amount || 0)]));
    const pnl = projects.map((p) => {
      const totalExpense = expByProject.get(p.id) || 0;
      const contract = Number(p.contractAmount || 0);
      const profit = contract - totalExpense;
      const margin = contract > 0 ? (profit / contract) * 100 : null;
      return {
        id: p.id,
        name: p.name,
        status: p.status,
        contractAmount: contract,
        totalExpense,
        profit,
        margin: margin != null ? Math.round(margin * 100) / 100 : null,
      };
    }).sort((a, b) => (a.margin ?? -Infinity) - (b.margin ?? -Infinity));

    return {
      thisMonth: { total: Number(thisMonth._sum.amount || 0), count: thisMonth._count },
      prevMonth: { total: Number(prevMonth._sum.amount || 0), count: prevMonth._count },
      allTime:   { total: Number(all._sum.amount || 0),       count: all._count },
      projectCount: projects.length,
      pnl,
    };
  },
};

// ============================================
// 등록
// ============================================
const TOOLS = {
  search_projects, get_project_summary,
  list_schedules, list_checklists,
  list_expenses, sum_expenses, list_account_codes,
  list_materials, list_purchase_orders, list_quotes,
  get_pnl_summary,
};

// 지출관리 토글 ON일 때 차단되는 도구 (지출/계정/PnL 모두)
const EXPENSE_TOOLS = new Set([
  'list_expenses', 'sum_expenses', 'list_account_codes', 'get_pnl_summary',
]);

function getToolSchemas(opts = {}) {
  return Object.values(TOOLS)
    .filter((t) => !(opts.hideExpenses && EXPENSE_TOOLS.has(t.schema.name)))
    .map((t) => t.schema);
}

async function executeTool(name, args, ctx) {
  if (ctx?.hideExpenses && EXPENSE_TOOLS.has(name)) {
    return { error: '지출관리 기능이 비활성화되어 있어 이 도구는 사용할 수 없습니다' };
  }
  const tool = TOOLS[name];
  if (!tool) return { error: `Unknown tool: ${name}` };
  try {
    // get_project_summary는 지출 정보 포함 → hideExpenses 시 지출 필드 마스킹
    const result = await tool.run(ctx, args || {});
    if (ctx?.hideExpenses && name === 'get_project_summary' && result && !result.error) {
      delete result.totalExpense;
      delete result.profit;
      delete result.margin;
      delete result.expenseCount;
    }
    return result;
  } catch (e) {
    console.error(`[aiTools] ${name} error:`, e);
    return { error: e.message || 'Internal error' };
  }
}

module.exports = { getToolSchemas, executeTool, TOOLS };
