import api from './client';

export const loungeApi = {
  categories: () => api.get('/lounge/categories').then((r) => r.data),
  tags: () => api.get('/lounge/tags').then((r) => r.data),
  me: () => api.get('/lounge/me').then((r) => r.data),
  updateMe: (payload) => api.patch('/lounge/me', payload).then((r) => r.data),

  posts: (params = {}) => api.get('/lounge/posts', { params }).then((r) => r.data),
  getPost: (id) => api.get(`/lounge/posts/${id}`).then((r) => r.data),
  createPost: (payload) => api.post('/lounge/posts', payload).then((r) => r.data),
  updatePost: (id, payload) => api.patch(`/lounge/posts/${id}`, payload).then((r) => r.data),
  removePost: (id) => api.delete(`/lounge/posts/${id}`).then((r) => r.data),

  addComment: (postId, body) =>
    api.post(`/lounge/posts/${postId}/comments`, { body }).then((r) => r.data),
  updateComment: (id, body) =>
    api.patch(`/lounge/comments/${id}`, { body }).then((r) => r.data),
  removeComment: (id) => api.delete(`/lounge/comments/${id}`).then((r) => r.data),

  toggleReaction: (postId) =>
    api.post(`/lounge/posts/${postId}/reactions`).then((r) => r.data),

  reportPost: (postId, payload) =>
    api.post(`/lounge/posts/${postId}/reports`, payload).then((r) => r.data),
  reportComment: (id, payload) =>
    api.post(`/lounge/comments/${id}/reports`, payload).then((r) => r.data),

  homePinned: () => api.get('/lounge/home-pinned').then((r) => r.data),

  listAttachments: (postId) =>
    api.get(`/lounge/posts/${postId}/attachments`).then((r) => r.data),
  uploadAttachments: (postId, kind, files) => {
    const fd = new FormData();
    fd.append('kind', kind);
    for (const f of files) fd.append('files', f);
    return api
      .post(`/lounge/posts/${postId}/attachments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  removeAttachment: (id) =>
    api.delete(`/lounge/attachments/${id}`).then((r) => r.data),
  downloadRuby: (id) =>
    api.get(`/lounge/attachments/${id}/download`).then((r) => r.data),
};
