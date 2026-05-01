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
  // 운영 메타 — 마이그레이션 / Cloudinary / 헬스체크
  listMigrations: () => api.get('/admin/migrations').then((r) => r.data),
  getCloudinaryUsage: (force = false) =>
    api.get('/admin/cloudinary-usage', { params: force ? { force: 'true' } : {} }).then((r) => r.data),
  getHealthCheck: (force = false) =>
    api.get('/admin/health-check', { params: force ? { force: 'true' } : {} }).then((r) => r.data),
  // 시스템 공지
  listAnnouncements: () => api.get('/admin/announcements').then((r) => r.data),
  createAnnouncement: (payload) => api.post('/admin/announcements', payload).then((r) => r.data),
  patchAnnouncement: (id, payload) => api.patch(`/admin/announcements/${id}`, payload).then((r) => r.data),
  deleteAnnouncement: (id) => api.delete(`/admin/announcements/${id}`).then((r) => r.data),
  // 백업 상태
  backupStatus: () => api.get('/admin/backup-status').then((r) => r.data),

  // 라운지 모더레이션
  loungeBackfill: () => api.post('/admin/lounge/backfill-memberships').then((r) => r.data),
  loungeReports: (status = 'pending') =>
    api.get('/admin/lounge/reports', { params: { status } }).then((r) => r.data),
  loungeResolveReport: (id, action, note) =>
    api.post(`/admin/lounge/reports/${id}/resolve`, { action, note }).then((r) => r.data),
  loungePinHome: (postId) =>
    api.post(`/admin/lounge/posts/${postId}/pin-home`).then((r) => r.data),
  loungeUnpinHome: (postId) =>
    api.delete(`/admin/lounge/posts/${postId}/pin-home`).then((r) => r.data),
  loungeHidePost: (postId) =>
    api.post(`/admin/lounge/posts/${postId}/hide`).then((r) => r.data),
  loungeUnhidePost: (postId) =>
    api.post(`/admin/lounge/posts/${postId}/unhide`).then((r) => r.data),
  loungeSuspend: (userId, note) =>
    api.post(`/admin/lounge/memberships/${userId}/suspend`, { note }).then((r) => r.data),
  loungeUnsuspend: (userId) =>
    api.post(`/admin/lounge/memberships/${userId}/unsuspend`).then((r) => r.data),
};

