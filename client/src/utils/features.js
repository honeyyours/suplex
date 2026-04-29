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

  SETTINGS_QUOTE_TEMPLATES: 'settings.quote_templates',
  SETTINGS_PHASE_LABELS:    'settings.phase_labels',
  SETTINGS_PHASE_KEYWORDS:  'settings.phase_keywords',
  SETTINGS_PHASE_DEADLINES: 'settings.phase_deadlines',
  SETTINGS_PHASE_ADVICE:    'settings.phase_advice',

  AI_ASSISTANT:     'ai.assistant',
  AI_BILLING_TOOLS: 'ai.billing_tools',
  AI_ADVISOR:       'ai.advisor',

  APPLIANCE_DB_UI:  'appliance.db_ui',
  RECEIPT_OCR:      'receipt.ocr',
  NOTIFICATION_KAKAO: 'notification.kakao',
});

// OWNER가 멤버 편집 모달에서 직원별로 토글 가능한 식별자 (베타 7개)
export const TOGGLEABLE_FEATURES = Object.freeze([
  F.SETTINGS_QUOTE_TEMPLATES,
  F.SETTINGS_PHASE_LABELS,
  F.SETTINGS_PHASE_KEYWORDS,
  F.SETTINGS_PHASE_DEADLINES,
  F.SETTINGS_PHASE_ADVICE,
  F.EXPENSES_VIEW,
  F.EXPENSES_EDIT,
]);

// 토글 항목 표시용 메타 (label, group)
export const TOGGLE_FEATURE_META = Object.freeze({
  [F.SETTINGS_QUOTE_TEMPLATES]: { label: '견적항목 템플릿 수정',     group: '회사 설정' },
  [F.SETTINGS_PHASE_LABELS]:    { label: '공정표시라벨 수정',       group: '회사 설정' },
  [F.SETTINGS_PHASE_KEYWORDS]:  { label: '공종자동인식키워드 수정', group: '회사 설정' },
  [F.SETTINGS_PHASE_DEADLINES]: { label: '공정별 발주데드라인 수정', group: '회사 설정' },
  [F.SETTINGS_PHASE_ADVICE]:    { label: '공정어드바이스 수정',     group: '회사 설정' },
  [F.EXPENSES_VIEW]:            { label: '지출관리 보기',           group: '지출관리' },
  [F.EXPENSES_EDIT]:            { label: '지출관리 추가/수정',      group: '지출관리' },
});

const ALL = Object.values(F);

const OWNER_FEATURES = [...ALL];

const DESIGNER_FEATURES = ALL.filter((f) => ![
  F.CORE_TEAM, F.EXPENSES_VIEW, F.EXPENSES_EDIT, F.AI_BILLING_TOOLS,
  F.SETTINGS_QUOTE_TEMPLATES, F.SETTINGS_PHASE_LABELS,
  F.SETTINGS_PHASE_KEYWORDS, F.SETTINGS_PHASE_DEADLINES, F.SETTINGS_PHASE_ADVICE,
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
  F.SETTINGS_QUOTE_TEMPLATES, F.SETTINGS_PHASE_LABELS,
  F.SETTINGS_PHASE_KEYWORDS, F.SETTINGS_PHASE_DEADLINES, F.SETTINGS_PHASE_ADVICE,
  F.AI_ASSISTANT,
];
const PRO = [...STARTER, F.RECEIPT_OCR, F.NOTIFICATION_KAKAO];
const ENTERPRISE = [...PRO, F.AI_BILLING_TOOLS, F.AI_ADVISOR, F.APPLIANCE_DB_UI];

export const PLAN_FEATURES = Object.freeze({
  STARTER, PRO, ENTERPRISE,
});

// auth = { role, company: { plan?, permissions? } }
// permissions: { [feature]: boolean } — UserPermission 명시값. OWNER는 무시.
export function hasFeature(auth, feature) {
  if (!auth) return false;
  const role = auth.role;
  const plan = auth.company?.plan || 'ENTERPRISE'; // 베타: plan 미설정 = ENTERPRISE 가정
  const planAllow = PLAN_FEATURES[plan]?.includes(feature) ?? false;
  if (!planAllow) return false;

  // OWNER는 토글 무시 (항상 ROLE_DEFAULTS)
  const permissions = auth.permissions;
  if (role !== 'OWNER' && permissions && Object.prototype.hasOwnProperty.call(permissions, feature)) {
    return permissions[feature] === true;
  }

  return ROLE_DEFAULTS[role]?.includes(feature) ?? false;
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
