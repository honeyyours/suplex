import api from './client';

export const totpApi = {
  status: () => api.get('/auth/totp/status').then((r) => r.data),
  setup: () => api.post('/auth/totp/setup').then((r) => r.data),
  enable: (code) => api.post('/auth/totp/enable', { code }).then((r) => r.data),
  disable: (password, code) => api.post('/auth/totp/disable', { password, code }).then((r) => r.data),
};
