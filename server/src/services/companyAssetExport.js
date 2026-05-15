// 회사 자산 JSON 익스포트 — 신규 회사 락인 시드용 + 자산 백업용.
// 사용자ID·프로젝트ID·이력 메타는 일절 포함하지 않음 (외부 회사 import 가능해야 함).
//
// 9개 회사 자산:
//   1) Company 메타 (phaseLabels, hideExpenses, rate* 12개)
//   2) Vendor
//   3) MaterialTemplate
//   4) QuoteLineItemTemplate
//   5) PhaseKeywordRule
//   6) PhaseDeadlineRule
//   7) PhaseAdvice (ruleType=STANDARD 만 — UNCONFIRMED_CHECK 시스템 룰 제외)
//   8) CompanyPhaseTip
//   9) AccountCode + ExpenseCategoryRule (회계 설정, 회사 내부 FK 보존)
//
// AccountCode ↔ ExpenseCategoryRule 의 회사 내부 FK는 임포트 매핑을 위해
// AccountCode.id를 보존하고, ExpenseCategoryRule.accountCodeId 도 같은 키로 보존.

const FORMAT_VERSION = 1;
const KIND = 'company-assets';

const COMPANY_META_FIELDS = [
  'phaseLabels',
  'hideExpenses',
  'rateIndirectMaterial',
  'rateIndirectLabor',
  'rateIndustrialAcc',
  'rateEmployment',
  'rateRetirement',
  'rateSafety',
  'rateOtherExpense',
  'rateMisc',
  'rateGeneralAdmin',
  'rateSupervision',
  'rateDesign',
  'rateVat',
];

async function exportCompanyAssets(prisma, companyId) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      name: true,
      ...Object.fromEntries(COMPANY_META_FIELDS.map((f) => [f, true])),
    },
  });
  if (!company) {
    throw Object.assign(new Error('회사를 찾을 수 없습니다'), { status: 404 });
  }

  const [
    vendors,
    materialTemplates,
    quoteLineItemTemplates,
    phaseKeywordRules,
    phaseDeadlineRules,
    phaseAdvices,
    companyPhaseTips,
    accountCodes,
    expenseCategoryRules,
  ] = await Promise.all([
    prisma.vendor.findMany({
      where: { companyId },
      select: {
        name: true, category: true, contact: true, phone: true,
        unitPrice: true, unit: true, bankAccount: true,
        defaultMeal: true, defaultTransport: true, memo: true,
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    }),
    prisma.materialTemplate.findMany({
      where: { companyId },
      select: {
        kind: true, spaceGroup: true, subgroup: true, itemName: true,
        formKey: true, defaultSiteNotes: true, essential: true,
        orderIndex: true, active: true,
      },
      orderBy: [{ kind: 'asc' }, { spaceGroup: 'asc' }, { orderIndex: 'asc' }],
    }),
    prisma.quoteLineItemTemplate.findMany({
      where: { companyId },
      select: {
        workType: true, itemName: true, spec: true, unit: true,
        defaultQuantity: true, defaultMaterialPrice: true,
        defaultLaborPrice: true, defaultExpensePrice: true,
        active: true, orderIndex: true,
      },
      orderBy: [{ workType: 'asc' }, { orderIndex: 'asc' }],
    }),
    prisma.phaseKeywordRule.findMany({
      where: { companyId },
      select: { keyword: true, phase: true, active: true },
      orderBy: { keyword: 'asc' },
    }),
    prisma.phaseDeadlineRule.findMany({
      where: { companyId },
      select: { phase: true, daysBefore: true, active: true },
      orderBy: { phase: 'asc' },
    }),
    prisma.phaseAdvice.findMany({
      where: { companyId, ruleType: 'STANDARD' },
      select: {
        phase: true, ruleType: true, daysBefore: true, title: true,
        description: true, category: true, requiresPhoto: true, active: true,
      },
      orderBy: [{ phase: 'asc' }, { daysBefore: 'asc' }],
    }),
    prisma.companyPhaseTip.findMany({
      where: { companyId },
      select: { phase: true, body: true },
      orderBy: { phase: 'asc' },
    }),
    // AccountCode 와 ExpenseCategoryRule 은 id 보존 (내부 FK 매핑용)
    prisma.accountCode.findMany({
      where: { companyId },
      select: {
        id: true, code: true, groupName: true,
        active: true, orderIndex: true,
      },
      orderBy: [{ groupName: 'asc' }, { orderIndex: 'asc' }],
    }),
    prisma.expenseCategoryRule.findMany({
      where: { companyId },
      select: {
        keyword: true, accountCodeId: true, siteCode: true,
        workCategory: true, priority: true, active: true,
      },
      orderBy: [{ priority: 'desc' }, { keyword: 'asc' }],
    }),
  ]);

  return {
    formatVersion: FORMAT_VERSION,
    kind: KIND,
    exportedAt: new Date().toISOString(),
    sourceCompanyName: company.name,
    company: Object.fromEntries(COMPANY_META_FIELDS.map((f) => [f, company[f]])),
    vendors,
    materialTemplates,
    quoteLineItemTemplates,
    phaseKeywordRules,
    phaseDeadlineRules,
    phaseAdvices,
    companyPhaseTips,
    accountCodes,
    expenseCategoryRules,
    counts: {
      vendors: vendors.length,
      materialTemplates: materialTemplates.length,
      quoteLineItemTemplates: quoteLineItemTemplates.length,
      phaseKeywordRules: phaseKeywordRules.length,
      phaseDeadlineRules: phaseDeadlineRules.length,
      phaseAdvices: phaseAdvices.length,
      companyPhaseTips: companyPhaseTips.length,
      accountCodes: accountCodes.length,
      expenseCategoryRules: expenseCategoryRules.length,
    },
  };
}

module.exports = {
  exportCompanyAssets,
  FORMAT_VERSION,
  KIND,
  COMPANY_META_FIELDS,
};
