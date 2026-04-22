import api from './client';

export const vendorsApi = {
  list: (params = {}) => api.get('/vendors', { params }).then((r) => r.data),
  categories: () => api.get('/vendors/categories').then((r) => r.data),
  create: (payload) => api.post('/vendors', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/vendors/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/vendors/${id}`).then((r) => r.data),
};
