import api from './client';

export const aiAssistantApi = {
  chat: (messages) =>
    api.post('/ai-assistant/chat', { messages }).then((r) => r.data),
};
