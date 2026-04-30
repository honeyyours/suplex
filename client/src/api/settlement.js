import api from './client';

// 정산 노트 — 프로젝트별 공정별 메모. 견적 가이드 드로어에 회사 누적 표시 (★ 핵심 사이클).
export const settlementApi = {
  list: (projectId) =>
    api.get(`/projects/${projectId}/settlement-notes`).then((r) => r.data),
  upsert: (projectId, phase, body) =>
    api.put(`/projects/${projectId}/settlement-notes`, { phase, body }).then((r) => r.data),
  // 회사 누적 — 특정 공정(phase)의 모든 프로젝트 정산 메모 최신순 (최대 20)
  companyByPhase: (phase) =>
    api.get('/projects/_company/settlement-notes', { params: { phase } }).then((r) => r.data),
};
