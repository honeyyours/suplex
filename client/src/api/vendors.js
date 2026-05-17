import api from './client';

export const vendorsApi = {
  list: (params = {}) => api.get('/vendors', { params }).then((r) => r.data),
  categories: () => api.get('/vendors/categories').then((r) => r.data),
  create: (payload) => api.post('/vendors', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/vendors/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/vendors/${id}`).then((r) => r.data),
  // 시공팀 연동 (2026-05-17)
  inviteCrew: (id) => api.post(`/vendors/${id}/crew-invite`).then((r) => r.data),
  linkCrew: (id, payload) => api.post(`/vendors/${id}/link-crew`, payload).then((r) => r.data),
  unlinkCrew: (id) => api.delete(`/vendors/${id}/crew-link`).then((r) => r.data),
};

export const crewApi = {
  // 인증 X — 초대 토큰 조회 (회사명 노출, 시공팀이 가입 결정 전에 보는 화면)
  getInvitation: (token) => api.get(`/crew/invitations/${token}`).then((r) => r.data),
  // CREW 인증 — 수락
  acceptInvitation: (token) => api.post('/crew/invitations/accept', { token }).then((r) => r.data),
  // CREW 인증 — 본인 거래 회사 매핑
  me: () => api.get('/crew/me').then((r) => r.data),
};
