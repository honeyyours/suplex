import api from './client';

export const schedulesApi = {
  list: (projectId, { start, end } = {}) =>
    api.get(`/projects/${projectId}/schedules`, { params: { start, end } }).then((r) => r.data),

  create: (projectId, payload) =>
    api.post(`/projects/${projectId}/schedules`, payload).then((r) => r.data),

  update: (projectId, id, payload) =>
    api.patch(`/projects/${projectId}/schedules/${id}`, payload).then((r) => r.data),

  remove: (projectId, id) =>
    api.delete(`/projects/${projectId}/schedules/${id}`).then((r) => r.data),

  toggleConfirm: (projectId, id) =>
    api.post(`/projects/${projectId}/schedules/${id}/toggle-confirm`).then((r) => r.data),

  extract: (projectId, { keyword, from } = {}) =>
    api.get(`/projects/${projectId}/schedules/extract`, { params: { keyword, from } }).then((r) => r.data),

  extractAll: ({ keyword, from } = {}) =>
    api.get('/schedules/extract', { params: { keyword, from } }).then((r) => r.data),

  listAll: ({ start, end } = {}) =>
    api.get('/schedules', { params: { start, end } }).then((r) => r.data),
};

export const scheduleChangesApi = {
  list: (projectId, { days, from, to } = {}) =>
    api.get(`/projects/${projectId}/schedule-changes`, { params: { days, from, to } }).then((r) => r.data),

  listAll: ({ days, from, to } = {}) =>
    api.get('/schedule-changes', { params: { days, from, to } }).then((r) => r.data),
};
