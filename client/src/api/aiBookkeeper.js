import api from './client';

export const aiBookkeeperApi = {
  chat: (messages) =>
    api.post('/ai-bookkeeper/chat', { messages }).then((r) => r.data),
};
