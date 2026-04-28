// 기능(Feature) 식별자 + 권한·구독 등급 매트릭스
// 권한과 구독 등급을 한 시스템으로 흡수: hasFeature(role, plan, feature)
// 자세한 설계: 메모리 `수플렉스_설계_가입권한플로우.md`
//
// 베타 단계: plan 컬럼 없음 → 모두 ENTERPRISE 가정. 가드 동작은 ROLE_DEFAULTS만 영향.
// 정식 출시: Company.plan enum 추가 후 PLAN_FEATURES가 자연스럽게 활성화됨.

// ============================================
// 기능 식별자
// ============================================
const F = Object.freeze({
  // 핵심 기능 (베타엔 전 역할 풀)
  CORE_PROJECTS:    'core.projects',
  CORE_SCHEDULE:    'core.schedule',
  CORE_MATERIALS:   'core.materials',
  CORE_CHECKLIST:   'core.checklist',
  CORE_REPORTS:     'core.reports',
  CORE_MEMO:        'core.memo',
  CORE_ORDERS:      'core.orders',
  CORE_QUOTES:      'core.quotes',
  CORE_TEAM:        'core.team',           // OWNER 한정 (멤버 관리)

  // 회계 (OWNER 한정, ENTERPRISE까지 풀)
  EXPENSES_VIEW:    'expenses.view',
  EXPENSES_EDIT:    'expenses.edit',

  // AI비서
  AI_ASSISTANT:     'ai.assistant',         // 메뉴 자체 (모두)
  AI_BILLING_TOOLS: 'ai.billing_tools',     // 회계 도구 (OWNER + ENTERPRISE)
  AI_ADVISOR:       'ai.advisor',           // AI 어드바이스 (보류, ENTERPRISE)

  // 차등 기능 (정식 출시 시 활성)
  APPLIANCE_DB_UI:  'appliance.db_ui',
  RECEIPT_OCR:      'receipt.ocr',
  NOTIFICATION_KAKAO: 'notification.kakao',
});

// 회계 도구 식별자(AI비서 도구 이름 → feature 매핑에 사용)
const BILLING_AI_TOOLS = new Set([
  'list_expenses',
  'sum_expenses',
  'list_account_codes',
  'get_pnl_summary',
  'get_project_summary', // 프로젝트 PnL 포함 → 회계 묶음
]);

// ============================================
// 역할별 디폴트 권한
// ============================================
const ALL_FEATURES = Object.values(F);

const OWNER_FEATURES = [...ALL_FEATURES];

const DESIGNER_FEATURES = ALL_FEATURES.filter((f) => ![
  F.CORE_TEAM,
  F.EXPENSES_VIEW,
  F.EXPENSES_EDIT,
  F.AI_BILLING_TOOLS,
].includes(f));

const FIELD_FEATURES = DESIGNER_FEATURES.filter((f) => ![
  F.CORE_ORDERS,
  F.CORE_QUOTES,
].includes(f));

const ROLE_DEFAULTS = Object.freeze({
  OWNER:    OWNER_FEATURES,
  DESIGNER: DESIGNER_FEATURES,
  FIELD:    FIELD_FEATURES,
});

// ============================================
// 플랜별 활성 기능 (정식 출시 시 활성, 베타엔 모두 ENTERPRISE 가정)
// ============================================
const STARTER_FEATURES = [
  F.CORE_PROJECTS, F.CORE_SCHEDULE, F.CORE_MATERIALS, F.CORE_CHECKLIST,
  F.CORE_REPORTS, F.CORE_MEMO, F.CORE_ORDERS, F.CORE_QUOTES, F.CORE_TEAM,
  F.EXPENSES_VIEW, F.EXPENSES_EDIT,
  F.AI_ASSISTANT,
];

const PRO_FEATURES = [
  ...STARTER_FEATURES,
  F.RECEIPT_OCR,
  F.NOTIFICATION_KAKAO,
];

const ENTERPRISE_FEATURES = [
  ...PRO_FEATURES,
  F.AI_BILLING_TOOLS,
  F.AI_ADVISOR,
  F.APPLIANCE_DB_UI,
];

const PLAN_FEATURES = Object.freeze({
  STARTER:    STARTER_FEATURES,
  PRO:        PRO_FEATURES,
  ENTERPRISE: ENTERPRISE_FEATURES,
});

// ============================================
// 통합 판정
// ============================================
function hasFeature({ role, plan } = {}, feature) {
  const roleAllow = ROLE_DEFAULTS[role]?.includes(feature) ?? false;
  // 베타: plan 미설정 = ENTERPRISE 가정
  const effectivePlan = plan || 'ENTERPRISE';
  const planAllow = PLAN_FEATURES[effectivePlan]?.includes(feature) ?? false;
  return roleAllow && planAllow;
}

function listFeatures({ role, plan } = {}) {
  const effectivePlan = plan || 'ENTERPRISE';
  const roleSet = new Set(ROLE_DEFAULTS[role] || []);
  const planSet = new Set(PLAN_FEATURES[effectivePlan] || []);
  return ALL_FEATURES.filter((f) => roleSet.has(f) && planSet.has(f));
}

module.exports = {
  F,
  ROLE_DEFAULTS,
  PLAN_FEATURES,
  BILLING_AI_TOOLS,
  hasFeature,
  listFeatures,
};
