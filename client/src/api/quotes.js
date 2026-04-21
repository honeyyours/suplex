import api from './client';

export const quotesApi = {
  list: (projectId) =>
    api.get(`/projects/${projectId}/quotes`).then((r) => r.data),
  get: (projectId, id) =>
    api.get(`/projects/${projectId}/quotes/${id}`).then((r) => r.data),
  create: (projectId, payload = {}) =>
    api.post(`/projects/${projectId}/quotes`, payload).then((r) => r.data),
  update: (projectId, id, payload) =>
    api.patch(`/projects/${projectId}/quotes/${id}`, payload).then((r) => r.data),
  remove: (projectId, id) =>
    api.delete(`/projects/${projectId}/quotes/${id}`).then((r) => r.data),
  duplicate: (projectId, id) =>
    api.post(`/projects/${projectId}/quotes/${id}/duplicate`).then((r) => r.data),

  // 라인 (세부 항목)
  addLine: (projectId, quoteId, payload) =>
    api.post(`/projects/${projectId}/quotes/${quoteId}/lines`, payload).then((r) => r.data),
  bulkLines: (projectId, quoteId, items) =>
    api.post(`/projects/${projectId}/quotes/${quoteId}/lines/bulk`, { items }).then((r) => r.data),
  updateLine: (projectId, quoteId, lineId, payload) =>
    api.patch(`/projects/${projectId}/quotes/${quoteId}/lines/${lineId}`, payload).then((r) => r.data),
  removeLine: (projectId, quoteId, lineId) =>
    api.delete(`/projects/${projectId}/quotes/${quoteId}/lines/${lineId}`).then((r) => r.data),
};

// 공종 (15종 고정 순서)
export const WORK_TYPES = [
  { key: 'START',      label: '공사시작' },
  { key: 'DEMOLITION', label: '철거' },
  { key: 'PLUMBING',   label: '설비' },
  { key: 'GAS',        label: '가스' },
  { key: 'ELECTRIC',   label: '전기' },
  { key: 'FIRE',       label: '소방' },
  { key: 'CARPENTRY',  label: '목공' },
  { key: 'TILE',       label: '타일' },
  { key: 'BATHROOM',   label: '욕실' },
  { key: 'PAINTING',   label: '도장' },
  { key: 'FILM',       label: '필름' },
  { key: 'WALLPAPER',  label: '도배' },
  { key: 'FURNITURE',  label: '가구' },
  { key: 'FLOORING',   label: '마루/장판' },
  { key: 'FINISHING',  label: '공사 마무리' },
];
export const WORK_TYPE_LABEL = Object.fromEntries(
  WORK_TYPES.map((w) => [w.key, w.label])
);
export const WORK_TYPE_ORDER = Object.fromEntries(
  WORK_TYPES.map((w, i) => [w.key, i])
);

export const QUOTE_STATUS_META = {
  DRAFT: { label: '작성중', color: 'bg-gray-100 text-gray-700' },
  SENT:  { label: '발송',   color: 'bg-sky-100 text-sky-700' },
  FINAL: { label: '최종',   color: 'bg-emerald-100 text-emerald-700' },
};

// 원가내역서 18행 정의 — UI에서 그대로 그릴 수 있게
export const COST_ROWS = [
  { idx: 1,  label: '직접재료비',    section: '재료비', formulaText: '',                   field: 'totalDirectMaterial',   apply: null,                      auto: 'fromLines' },
  { idx: 2,  label: '간접재료비',    section: '재료비', formulaText: '(1) × ',              field: 'totalIndirectMaterial', apply: 'applyIndirectMaterial',   rate: 'rateIndirectMaterial' },
  { idx: 3,  label: '[ 소  계 ]',    section: '재료비', formulaText: '(1)+(2)',             field: 'totalMaterial',         apply: null,                      auto: 'subtotal' },
  { idx: 4,  label: '직접노무비',    section: '노무비', formulaText: '',                   field: 'totalDirectLabor',      apply: null,                      auto: 'fromLines' },
  { idx: 5,  label: '간접노무비',    section: '노무비', formulaText: '(4) × ',              field: 'totalIndirectLabor',    apply: 'applyIndirectLabor',      rate: 'rateIndirectLabor' },
  { idx: 6,  label: '[ 소  계 ]',    section: '노무비', formulaText: '(4)+(5)',             field: 'totalLabor',            apply: null,                      auto: 'subtotal' },
  { idx: 7,  label: '기계경비',      section: '경비',   formulaText: '',                   field: 'totalDirectExpense',    apply: null,                      auto: 'fromLines' },
  { idx: 8,  label: '산재보험료',    section: '경비',   formulaText: '(6) × ',              field: 'totalIndustrialAcc',    apply: 'applyIndustrialAcc',      rate: 'rateIndustrialAcc' },
  { idx: 9,  label: '고용보험료',    section: '경비',   formulaText: '(4) × ',              field: 'totalEmployment',       apply: 'applyEmployment',         rate: 'rateEmployment' },
  { idx: 10, label: '퇴직공제부금비', section: '경비',   formulaText: '(4) × ',              field: 'totalRetirement',       apply: 'applyRetirement',         rate: 'rateRetirement' },
  { idx: 11, label: '안전관리비',    section: '경비',   formulaText: '[(1)+(4)] × ',         field: 'totalSafety',           apply: 'applySafety',             rate: 'rateSafety' },
  { idx: 12, label: '기타경비',      section: '경비',   formulaText: '[(1)+(4)] × ',         field: 'totalOtherExpense',     apply: 'applyOtherExpense',       rate: 'rateOtherExpense' },
  { idx: 13, label: '[ 소  계 ]',    section: '경비',   formulaText: '(7)+...+(12)',         field: 'totalExpense',          apply: null,                      auto: 'subtotal' },
  { idx: 14, label: '계',            section: '공사가', formulaText: '(3)+(6)+(13)',         field: 'totalDirect',           apply: null,                      auto: 'subtotal' },
  { idx: 15, label: '공잡비',        section: '공사가', formulaText: '(14) × ',              field: 'totalMisc',             apply: 'applyMisc',               rate: 'rateMisc' },
  { idx: 16, label: '일반관리비',    section: '공사가', formulaText: '(14) × ',              field: 'totalGeneralAdmin',     apply: 'applyGeneralAdmin',       rate: 'rateGeneralAdmin' },
  { idx: 17, label: '감리비',        section: '공사가', formulaText: '[(14)+(15)+(16)] × ',  field: 'totalSupervision',      apply: 'applySupervision',        rate: 'rateSupervision' },
  { idx: 18, label: '디자인비',      section: '공사가', formulaText: '(14) × ',              field: 'totalDesign',           apply: 'applyDesign',             rate: 'rateDesign' },
];

// 12개 비율 메타
export const RATE_META = [
  { key: 'rateIndirectMaterial', label: '간접재료비',    formula: '(1) × X%' },
  { key: 'rateIndirectLabor',    label: '간접노무비',    formula: '(4) × X%' },
  { key: 'rateIndustrialAcc',    label: '산재보험료',    formula: '(6) × X%' },
  { key: 'rateEmployment',       label: '고용보험료',    formula: '(4) × X%' },
  { key: 'rateRetirement',       label: '퇴직공제부금비', formula: '(4) × X%' },
  { key: 'rateSafety',           label: '안전관리비',    formula: '[(1)+(4)] × X%' },
  { key: 'rateOtherExpense',     label: '기타경비',      formula: '[(1)+(4)] × X%' },
  { key: 'rateMisc',             label: '공잡비',        formula: '(14) × X%' },
  { key: 'rateGeneralAdmin',     label: '일반관리비',    formula: '(14) × X%' },
  { key: 'rateSupervision',      label: '감리비',        formula: '[(14)+(15)+(16)] × X%' },
  { key: 'rateDesign',           label: '디자인비',      formula: '(14) × X%' },
  { key: 'rateVat',              label: '부가가치세',    formula: '공급가액 × X% (별도)' },
];

export function formatWon(v) {
  if (v == null || v === '') return '0';
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return Math.round(n).toLocaleString('ko-KR');
}

export function parseWon(s) {
  if (s == null) return 0;
  const cleaned = String(s).replace(/[^\d.-]/g, '');
  if (cleaned === '' || cleaned === '-') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// 평당 단가 (전체합 / 평수)
export function pricePerPyeong(total, area) {
  const a = Number(area);
  if (!a || a <= 0) return null;
  return Math.round(Number(total) / a);
}

// 한국 금액 → 한글 표기 (간단 변환, 만/억 단위)
const D = ['', '일','이','삼','사','오','육','칠','팔','구'];
const U = ['', '십','백','천'];
const B = ['', '만','억','조'];
export function numberToKorean(n) {
  n = Math.round(Number(n) || 0);
  if (n === 0) return '영원정';
  const groups = [];
  while (n > 0) {
    groups.push(n % 10000);
    n = Math.floor(n / 10000);
  }
  let out = '';
  groups.forEach((g, gi) => {
    if (g === 0) return;
    let s = '';
    const digits = String(g).split('').reverse();
    digits.forEach((d, i) => {
      const num = Number(d);
      if (num > 0) s = D[num] + U[i] + s;
    });
    out = s + B[gi] + out;
  });
  return out + '원정';
}
