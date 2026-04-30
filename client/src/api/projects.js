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
  // 단일 공정의 4축 상세 — WorkContextDrawer에서 사용
  phaseDetail: (id, phase) => api.get(`/projects/${id}/phase-detail`, { params: { phase } }).then((r) => r.data),

  // 프로젝트 멤버 관리 (Step 4 — 출구정리 정책)
  listMembers:    (id) => api.get(`/projects/${id}/members`).then((r) => r.data),
  addMember:      (id, payload) => api.post(`/projects/${id}/members`, payload).then((r) => r.data),
  updateMember:   (id, userId, payload) => api.patch(`/projects/${id}/members/${userId}`, payload).then((r) => r.data),
  removeMember:   (id, userId) => api.delete(`/projects/${id}/members/${userId}`).then((r) => r.data),
};
