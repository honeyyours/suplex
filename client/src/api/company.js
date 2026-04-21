import api from './client';

export const companyApi = {
  get: () => api.get('/company').then((r) => r.data),
  update: (payload) => api.patch('/company', payload).then((r) => r.data),
};
