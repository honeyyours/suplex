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

  // 회사 내 다른 견적 검색 (불러오기 모달용)
  sources: (projectId, q = '') =>
    api.get(`/projects/${projectId}/simple-quotes/_sources`, { params: { q } }).then((r) => r.data),
  importLines: (projectId, id, sourceId, mode = 'append') =>
    api.post(`/projects/${projectId}/simple-quotes/${id}/import-lines`, { sourceId, mode }).then((r) => r.data),

  // 같은 프로젝트 내 견적 복제 (헤더 + 라인 모두 복사 + 새 차수, 원본 SUPERSEDED)
  duplicate: (projectId, id) =>
    api.post(`/projects/${projectId}/simple-quotes/${id}/duplicate`).then((r) => r.data),

  // AI 차이 비교 (직전 차수와 변경사항 한국어 요약)
  compare: (projectId, id, previousId) =>
    api.post(`/projects/${projectId}/simple-quotes/${id}/compare`, { previousId }).then((r) => r.data),

  // 견적 공정 → 마감재 그룹으로 자동 추가 (placeholder Material 1개씩, 중복 spaceGroup 자동 스킵)
  sendToMaterials: (projectId, id) =>
    api.post(`/projects/${projectId}/simple-quotes/${id}/send-to-materials`).then((r) => r.data),
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
