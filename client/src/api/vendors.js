import api from './client';

export const vendorsApi = {
  list: (params = {}) => api.get('/vendors', { params }).then((r) => r.data),
  categories: () => api.get('/vendors/categories').then((r) => r.data),
  create: (payload) => api.post('/vendors', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/vendors/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/vendors/${id}`).then((r) => r.data),
  // 시공팀 매핑 — Vendor 단위 (목공 3:1 케이스 + 해제)
  // 새 시공팀 초대는 회사 단위(crewInvitationsApi)로 이전됨 (2026-05-17 Step 4)
  linkCrew: (id, payload) => api.post(`/vendors/${id}/link-crew`, payload).then((r) => r.data),
  unlinkCrew: (id) => api.delete(`/vendors/${id}/crew-link`).then((r) => r.data),
};

// 회사 단위 시공팀 초대 (OWNER) — Step 4 정정
export const crewInvitationsApi = {
  list: () => api.get('/team/crew-invitations').then((r) => r.data),
  create: (payload = {}) => api.post('/team/crew-invitations', payload).then((r) => r.data),
  remove: (id) => api.delete(`/team/crew-invitations/${id}`).then((r) => r.data),
};

export const crewApi = {
  // 인증 X — 초대 토큰 조회 (회사명 노출, 시공팀이 가입 결정 전에 보는 화면)
  getInvitation: (token) => api.get(`/crew/invitations/${token}`).then((r) => r.data),
  // CREW 인증 — 수락
  acceptInvitation: (token) => api.post('/crew/invitations/accept', { token }).then((r) => r.data),
  // CREW 인증 — 본인 프로필 + 거래 회사 매핑
  me: () => api.get('/crew/me').then((r) => r.data),
  updateMe: (payload) => api.patch('/crew/me', payload).then((r) => r.data),
  // CREW 인증 — 본인 매핑 Vendor들의 일정 통합 (회사 색상 분리·더블 부킹 표시용)
  schedules: (from, to) => api.get('/crew/schedules', { params: { from, to } }).then((r) => r.data),
};
