import api from './client';

export const quoteTemplatesApi = {
  list: (workType) =>
    api.get('/quote-templates', { params: { workType } }).then((r) => r.data),
  create: (payload) =>
    api.post('/quote-templates', payload).then((r) => r.data),
  update: (id, payload) =>
    api.patch(`/quote-templates/${id}`, payload).then((r) => r.data),
  remove: (id) =>
    api.delete(`/quote-templates/${id}`).then((r) => r.data),
  seed: (force = false) =>
    api.post('/quote-templates/seed', { force }).then((r) => r.data),
  bulk: (items) =>
    api.post('/quote-templates/bulk', { items }).then((r) => r.data),
};
