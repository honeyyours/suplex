import api from './client';

export const teamApi = {
  list: () => api.get('/team/members').then((r) => r.data),
  create: (payload) => api.post('/team/members', payload).then((r) => r.data),
  update: (userId, payload) =>
    api.patch(`/team/members/${userId}`, payload).then((r) => r.data),
  resetPassword: (userId, password) =>
    api.patch(`/team/members/${userId}/password`, { password }).then((r) => r.data),
  remove: (userId) => api.delete(`/team/members/${userId}`).then((r) => r.data),
};

export const ROLE_META = {
  OWNER:    { label: '대표',    color: 'bg-violet-100 text-violet-800 border-violet-200' },
  DESIGNER: { label: '디자인팀', color: 'bg-sky-100 text-sky-800 border-sky-200' },
  FIELD:    { label: '현장팀',   color: 'bg-amber-100 text-amber-800 border-amber-200' },
};
export const ROLE_KEYS = Object.keys(ROLE_META);
