import api from './client';

export const phaseDeadlinesApi = {
  list: () => api.get('/phase-rules/deadlines').then((r) => r.data),
  upsert: (payload) => api.post('/phase-rules/deadlines', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/phase-rules/deadlines/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/phase-rules/deadlines/${id}`).then((r) => r.data),
  seedDefaults: () => api.post('/phase-rules/deadlines/seed-defaults').then((r) => r.data),
};

export const phaseAdvicesApi = {
  list: () => api.get('/phase-rules/advices').then((r) => r.data),
  create: (payload) => api.post('/phase-rules/advices', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/phase-rules/advices/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/phase-rules/advices/${id}`).then((r) => r.data),
  seedStandard: () => api.post('/phase-rules/advices/seed-standard').then((r) => r.data),
  bulkDuplicate: (ids) => api.post('/phase-rules/advices/bulk-duplicate', { ids }).then((r) => r.data),
  bulkDelete: (ids) => api.post('/phase-rules/advices/bulk-delete', { ids }).then((r) => r.data),
};

// 시스템 프리셋 리셋 — 4묶음 중 1개를 표준 회사 데이터로 갱신.
// bundle: 'phaseLabels' | 'phaseKeywordRules' | 'phaseDeadlineRules' | 'phaseAdvices'
export const phasePresetApi = {
  reset: (bundle) => api.post('/phase-rules/preset/reset', { bundle }).then((r) => r.data),
};
