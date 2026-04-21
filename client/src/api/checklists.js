import api from './client';

export const checklistsApi = {
  list: (projectId) =>
    api.get(`/projects/${projectId}/checklists`).then((r) => r.data),
  listAll: () => api.get('/checklists').then((r) => r.data),
  create: (projectId, payload) =>
    api.post(`/projects/${projectId}/checklists`, payload).then((r) => r.data),
  update: (projectId, id, payload) =>
    api.patch(`/projects/${projectId}/checklists/${id}`, payload).then((r) => r.data),
  remove: (projectId, id) =>
    api.delete(`/projects/${projectId}/checklists/${id}`).then((r) => r.data),
  toggle: (projectId, id) =>
    api.post(`/projects/${projectId}/checklists/${id}/toggle`).then((r) => r.data),
};

export const CATEGORY_META = {
  GENERAL: { label: '일반', color: 'bg-gray-100 text-gray-700' },
  CLIENT_REQUEST: { label: '고객요청', color: 'bg-rose-100 text-rose-700' },
  DESIGN_TO_FIELD: { label: '디자인→현장', color: 'bg-sky-100 text-sky-700' },
  TOUCH_UP: { label: '잔손', color: 'bg-amber-100 text-amber-800' },
  URGENT: { label: '긴급', color: 'bg-red-600 text-white' },
};

export const CATEGORY_KEYS = Object.keys(CATEGORY_META);
