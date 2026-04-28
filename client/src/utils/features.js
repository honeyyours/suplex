// 기능(Feature) 식별자 + 권한·구독 등급 매트릭스 (클라이언트 사본)
// 백엔드 `server/src/services/features.js`와 매트릭스를 일치시킬 것.
// 백엔드가 진실의 원천이고 본 파일은 UI 가드(메뉴 숨김 등)에만 사용.

export const F = Object.freeze({
  CORE_PROJECTS:    'core.projects',
  CORE_SCHEDULE:    'core.schedule',
  CORE_MATERIALS:   'core.materials',
  CORE_CHECKLIST:   'core.checklist',
  CORE_REPORTS:     'core.reports',
  CORE_MEMO:        'core.memo',
  CORE_ORDERS:      'core.orders',
  CORE_QUOTES:      'core.quotes',
  CORE_TEAM:        'core.team',

  EXPENSES_VIEW:    'expenses.view',
  EXPENSES_EDIT:    'expenses.edit',

  AI_ASSISTANT:     'ai.assistant',
  AI_BILLING_TOOLS: 'ai.billing_tools',
  AI_ADVISOR:       'ai.advisor',

  APPLIANCE_DB_UI:  'appliance.db_ui',
  RECEIPT_OCR:      'receipt.ocr',
  NOTIFICATION_KAKAO: 'notification.kakao',
});

const ALL = Object.values(F);

const OWNER_FEATURES = [...ALL];

const DESIGNER_FEATURES = ALL.filter((f) => ![
  F.CORE_TEAM, F.EXPENSES_VIEW, F.EXPENSES_EDIT, F.AI_BILLING_TOOLS,
].includes(f));

const FIELD_FEATURES = DESIGNER_FEATURES.filter((f) => ![
  F.CORE_ORDERS, F.CORE_QUOTES,
].includes(f));

export const ROLE_DEFAULTS = Object.freeze({
  OWNER:    OWNER_FEATURES,
  DESIGNER: DESIGNER_FEATURES,
  FIELD:    FIELD_FEATURES,
});

const STARTER = [
  F.CORE_PROJECTS, F.CORE_SCHEDULE, F.CORE_MATERIALS, F.CORE_CHECKLIST,
  F.CORE_REPORTS, F.CORE_MEMO, F.CORE_ORDERS, F.CORE_QUOTES, F.CORE_TEAM,
  F.EXPENSES_VIEW, F.EXPENSES_EDIT,
  F.AI_ASSISTANT,
];
const PRO = [...STARTER, F.RECEIPT_OCR, F.NOTIFICATION_KAKAO];
const ENTERPRISE = [...PRO, F.AI_BILLING_TOOLS, F.AI_ADVISOR, F.APPLIANCE_DB_UI];

export const PLAN_FEATURES = Object.freeze({
  STARTER, PRO, ENTERPRISE,
});

// auth = { role, company: { plan? } }
export function hasFeature(auth, feature) {
  if (!auth) return false;
  const role = auth.role;
  const plan = auth.company?.plan || 'ENTERPRISE'; // 베타: plan 미설정 = ENTERPRISE 가정
  const roleAllow = ROLE_DEFAULTS[role]?.includes(feature) ?? false;
  const planAllow = PLAN_FEATURES[plan]?.includes(feature) ?? false;
  return roleAllow && planAllow;
}

// hideExpenses 토글까지 합친 종합 판정 (자주 쓰는 패턴)
// hideExpenses=true면 지출/AI비서/회계 도구 모두 차단 (메모리: "지출관리·AI비서, 프로젝트의 지출 탭, 홈의 지출 활동")
const HIDE_EXPENSES_AFFECTED = [
  F.EXPENSES_VIEW, F.EXPENSES_EDIT,
  F.AI_ASSISTANT, F.AI_BILLING_TOOLS,
];

export function canAccess(auth, feature) {
  if (!auth) return false;
  if (auth.company?.hideExpenses && HIDE_EXPENSES_AFFECTED.includes(feature)) {
    return false;
  }
  return hasFeature(auth, feature);
}
