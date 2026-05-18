import api from './client';

export const notificationsApi = {
  list: () => api.get('/notifications').then((r) => r.data.items),
  unreadCount: () => api.get('/notifications/unread-count').then((r) => r.data.count),
  read: (id) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  readAll: () => api.post('/notifications/read-all').then((r) => r.data),
  remove: (id) => api.delete(`/notifications/${id}`).then((r) => r.data),
};
