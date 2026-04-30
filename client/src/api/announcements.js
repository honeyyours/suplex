import api from './client';

export const announcementsApi = {
  active: () => api.get('/announcements/active').then((r) => r.data),
};
