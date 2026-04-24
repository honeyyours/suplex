import api from './client';

export const materialsApi = {
  list: (projectId, kind) =>
    api.get(`/projects/${projectId}/materials`, { params: { kind } }).then((r) => r.data),
  create: (projectId, payload) =>
    api.post(`/projects/${projectId}/materials`, payload).then((r) => r.data),
  update: (projectId, id, payload) =>
    api.patch(`/projects/${projectId}/materials/${id}`, payload).then((r) => r.data),
  remove: (projectId, id) =>
    api.delete(`/projects/${projectId}/materials/${id}`).then((r) => r.data),
  history: (projectId, id) =>
    api.get(`/projects/${projectId}/materials/${id}/history`).then((r) => r.data),
  bulkCreate: (projectId, items) =>
    api.post(`/projects/${projectId}/materials/bulk`, { items }).then((r) => r.data),
  clear: (projectId) =>
    api.delete(`/projects/${projectId}/materials`).then((r) => r.data),
};

export const materialTemplatesApi = {
  list: (kind) =>
    api.get('/material-templates', { params: { kind } }).then((r) => r.data),
  seed: (force = false) =>
    api.post('/material-templates/seed', { force }).then((r) => r.data),
  create: (payload) =>
    api.post('/material-templates', payload).then((r) => r.data),
  update: (id, payload) =>
    api.patch(`/material-templates/${id}`, payload).then((r) => r.data),
  remove: (id) =>
    api.delete(`/material-templates/${id}`).then((r) => r.data),
  backfillFormKey: () =>
    api.post('/material-templates/backfill-formkey').then((r) => r.data),
};

// 4가지 status (legacy 2개 자동 매핑):
//   UNDECIDED/REVIEWING → 모델 확인 필요
//   CHANGED → 확정
//   REUSED → 재사용
//   NOT_APPLICABLE → 해당 없음
//   CONFIRMED → 확정
export const STATUS_META = {
  UNDECIDED:      { label: '🔍 모델 확인 필요', short: '🔍 미정',   color: 'bg-gray-100 text-gray-700',     group: 'pending' },
  REVIEWING:      { label: '🔍 모델 확인 필요', short: '🔍 미정',   color: 'bg-gray-100 text-gray-700',     group: 'pending' },
  CONFIRMED:      { label: '✅ 확정',          short: '✅ 확정',    color: 'bg-emerald-100 text-emerald-700', group: 'done' },
  CHANGED:        { label: '✅ 확정',          short: '✅ 확정',    color: 'bg-emerald-100 text-emerald-700', group: 'done' },
  REUSED:         { label: '♻️ 재사용',        short: '♻️ 재사용',  color: 'bg-sky-100 text-sky-700',       group: 'done' },
  NOT_APPLICABLE: { label: '⊘ 해당 없음',      short: '⊘ 해당없음',  color: 'bg-gray-100 text-gray-400',     group: 'na' },
};

// UI에서 사용자가 선택할 수 있는 4가지 enum (legacy 2개 제외)
export const STATUS_OPTIONS = [
  { key: 'UNDECIDED',      label: '🔍 모델 확인 필요' },
  { key: 'CONFIRMED',      label: '✅ 확정' },
  { key: 'REUSED',         label: '♻️ 재사용' },
  { key: 'NOT_APPLICABLE', label: '⊘ 해당 없음' },
];
export const STATUS_KEYS = ['UNDECIDED', 'CONFIRMED', 'REUSED', 'NOT_APPLICABLE'];

export const KIND_META = {
  FINISH:    { label: '마감재', color: 'bg-navy-100 text-navy-700' },
  APPLIANCE: { label: '가전·가구', color: 'bg-violet-100 text-violet-700' },
};

export const FIELD_LABEL = {
  __created__: '생성',
  kind: '구분',
  spaceGroup: '공간/공정',
  itemName: '세부 공정',
  brand: '브랜드',
  productName: '자재명/품번',
  spec: '규격',
  siteNotes: '시공 특이사항',
  purchaseSource: '매입처',
  checked: '체크(V)',
  installed: '설치유무',
  size: '사이즈',
  remarks: '비고',
  status: '상태',
  quantity: '수량',
  unit: '단위',
  unitPrice: '단가',
  totalPrice: '합계',
  memo: '메모',
};

export function formatCurrency(v) {
  if (v == null || v === '') return '';
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString('ko-KR');
}
