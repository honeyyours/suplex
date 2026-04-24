import api from './client';

export const checklistTemplatesApi = {
  list: (params = {}) => api.get('/checklist-templates', { params }).then((r) => r.data),
  create: (payload) => api.post('/checklist-templates', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/checklist-templates/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/checklist-templates/${id}`).then((r) => r.data),
  seed: (force = false) =>
    api.post('/checklist-templates/seed', { force }).then((r) => r.data),
};

export const projectChecklistsApi = {
  fromTemplates: (projectId, templateIds) =>
    api.post(`/projects/${projectId}/checklists/from-templates`, { templateIds }).then((r) => r.data),
};
