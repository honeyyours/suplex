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
  // 자동 학습 — 사용자가 마감재에 입력한 가전 데이터 자동 누적 (회사간 공유)
  // 본문: { modelCode, productName?, brand?, category?, sizeStr (W × D × H) }
  learn: (payload) => api.post('/appliance-specs/learn', payload).then((r) => r.data),
};
