import api from './client';

export const dashboardApi = {
  todayActions: () => api.get('/dashboard/today-actions').then((r) => r.data),
};
