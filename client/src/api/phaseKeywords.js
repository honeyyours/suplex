import api from './client';

export const phaseKeywordsApi = {
  list: (params = {}) => api.get('/phase-keywords', { params }).then((r) => r.data),
  create: (payload) => api.post('/phase-keywords', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/phase-keywords/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/phase-keywords/${id}`).then((r) => r.data),
  seed: (force = false) => api.post('/phase-keywords/seed', { force }).then((r) => r.data),
};
