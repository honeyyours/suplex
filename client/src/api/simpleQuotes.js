import api from './client';

export const simpleQuotesApi = {
  list: (projectId) =>
    api.get(`/projects/${projectId}/simple-quotes`).then((r) => r.data),
  get: (projectId, id) =>
    api.get(`/projects/${projectId}/simple-quotes/${id}`).then((r) => r.data),
  create: (projectId, payload = {}) =>
    api.post(`/projects/${projectId}/simple-quotes`, payload).then((r) => r.data),
  update: (projectId, id, payload) =>
    api.patch(`/projects/${projectId}/simple-quotes/${id}`, payload).then((r) => r.data),
  remove: (projectId, id) =>
    api.delete(`/projects/${projectId}/simple-quotes/${id}`).then((r) => r.data),
  putLines: (projectId, id, lines) =>
    api.put(`/projects/${projectId}/simple-quotes/${id}/lines`, { lines }).then((r) => r.data),
};

export const SIMPLE_QUOTE_STATUS_META = {
  DRAFT:      { label: '작성 중',   color: 'bg-gray-100 text-gray-600' },
  SENT:       { label: '발송됨',    color: 'bg-sky-100 text-sky-700' },
  ACCEPTED:   { label: '수주 확정', color: 'bg-emerald-100 text-emerald-700' },
  SUPERSEDED: { label: '대체됨',    color: 'bg-amber-100 text-amber-700' },
};

export function formatWon(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('ko-KR');
}

export function parseWon(s) {
  if (s == null) return 0;
  const n = Number(String(s).replace(/[,\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
