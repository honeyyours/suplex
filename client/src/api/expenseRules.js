import api from './client';

export const expenseRulesApi = {
  list: (params = {}) => api.get('/expense-rules', { params }).then((r) => r.data),
  create: (payload) => api.post('/expense-rules', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/expense-rules/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/expense-rules/${id}`).then((r) => r.data),
  classify: (texts) => api.post('/expense-rules/classify', { texts }).then((r) => r.data),
};
