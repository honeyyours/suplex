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
};

export const STATUS_META = {
  UNDECIDED: { label: '미정',   color: 'bg-gray-100 text-gray-700' },
  REVIEWING: { label: '확인중', color: 'bg-amber-100 text-amber-800' },
  CONFIRMED: { label: '확정',   color: 'bg-emerald-100 text-emerald-700' },
  CHANGED:   { label: '변경',   color: 'bg-orange-100 text-orange-800' },
};
export const STATUS_KEYS = Object.keys(STATUS_META);

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
