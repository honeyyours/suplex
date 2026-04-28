import api from './client';

export const adminApi = {
  listCompanies: (params = {}) => api.get('/admin/companies', { params }).then((r) => r.data),
  listUsers: (q) => api.get('/admin/users', { params: q ? { q } : {} }).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  deleteCompany: (id) => api.delete(`/admin/companies/${id}`).then((r) => r.data),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`).then((r) => r.data),
  patchUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then((r) => r.data),
  stats: () => api.get('/admin/stats').then((r) => r.data),
  transferOwnership: (companyId, userId) =>
    api.post(`/admin/companies/${companyId}/transfer-ownership`, { userId }).then((r) => r.data),
  impersonate: (companyId) =>
    api.post(`/admin/companies/${companyId}/impersonate`).then((r) => r.data),
  cleanupInvitations: () => api.post('/admin/cleanup-invitations').then((r) => r.data),
  // 회사 백업은 다운로드라 별도 url 사용
  backupUrl: (companyId) => `/api/admin/companies/${companyId}/backup`,
};

