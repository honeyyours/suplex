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
  listAuditLogs: (params = {}) => api.get('/admin/audit-logs', { params }).then((r) => r.data),
  normalizePhases: (dryRun = false) =>
    api.post('/admin/normalize-phases', { dryRun }).then((r) => r.data),
  seedDemoProject: (companyId) =>
    api.post(`/admin/companies/${companyId}/seed-demo-project`).then((r) => r.data),
  setPresetDefault: (companyId, isDefault) =>
    api.post(`/admin/companies/${companyId}/preset-default`, { default: isDefault }).then((r) => r.data),
  // 베타 진입 통제 — 승인 대기 회사
  listPendingCompanies: () => api.get('/admin/companies/pending').then((r) => r.data),
  approveCompany: (id) => api.post(`/admin/companies/${id}/approve`).then((r) => r.data),
  rejectCompany: (id) => api.post(`/admin/companies/${id}/reject`).then((r) => r.data),
  // 등급 관리
  changeCompanyPlan: (id, plan) => api.patch(`/admin/companies/${id}/plan`, { plan }).then((r) => r.data),
  getPlanFeatures: () => api.get('/admin/plan-features').then((r) => r.data),
};

