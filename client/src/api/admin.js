import api from './client';

export const adminApi = {
  listCompanies: () => api.get('/admin/companies').then((r) => r.data),
  listUsers: (q) => api.get('/admin/users', { params: q ? { q } : {} }).then((r) => r.data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  deleteCompany: (id) => api.delete(`/admin/companies/${id}`).then((r) => r.data),
  resetPassword: (id) => api.post(`/admin/users/${id}/reset-password`).then((r) => r.data),
  patchUser: (id, payload) => api.patch(`/admin/users/${id}`, payload).then((r) => r.data),
  stats: () => api.get('/admin/stats').then((r) => r.data),
};
