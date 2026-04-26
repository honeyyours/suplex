import api from './client';

export const applianceSpecsApi = {
  // 검색·자동완성 — 모든 사용자
  search: (params) => api.get('/appliance-specs/search', { params }).then((r) => r.data),
  // 어드민 목록
  list: (params) => api.get('/appliance-specs', { params }).then((r) => r.data),
  // 상세
  get: (id) => api.get(`/appliance-specs/${id}`).then((r) => r.data),
  // 어드민 CRUD (OWNER)
  create: (payload) => api.post('/appliance-specs', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/appliance-specs/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/appliance-specs/${id}`).then((r) => r.data),
  // 사용자 정정 — 모든 사용자
  correct: (id, payload) => api.post(`/appliance-specs/${id}/correct`, payload).then((r) => r.data),
};
