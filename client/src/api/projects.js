import api from './client';

export const projectsApi = {
  list: (params = {}) => api.get('/projects', { params }).then((r) => r.data),
  get: (id) => api.get(`/projects/${id}`).then((r) => r.data),
  create: (payload) => api.post('/projects', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/projects/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/projects/${id}`).then((r) => r.data),
  // 시연용 샘플 — 모든 기능 발현되는 프로젝트 + 데이터 일괄 생성
  seedSample: () => api.post('/projects/_seed-sample').then((r) => r.data),
  // 공정 현황 — 25개 표준 공정 × 4축(견적·마감재·일정·발주) 통합 뷰
  processOverview: (id) => api.get(`/projects/${id}/process-overview`).then((r) => r.data),
};
