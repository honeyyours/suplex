import api from './client';

export const invitationsApi = {
  list: () => api.get('/invitations').then((r) => r.data),
  create: (payload) => api.post('/invitations', payload).then((r) => r.data),
  remove: (id) => api.delete(`/invitations/${id}`).then((r) => r.data),
  byToken: (token) => api.get(`/invitations/by-token/${token}`).then((r) => r.data),
};
