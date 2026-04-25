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
};
