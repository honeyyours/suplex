import api from './client';

export const projectMemosApi = {
  list: (projectId) =>
    api.get(`/projects/${projectId}/memos`).then((r) => r.data),
  create: (projectId, payload) =>
    api.post(`/projects/${projectId}/memos`, payload).then((r) => r.data),
  update: (projectId, id, payload) =>
    api.patch(`/projects/${projectId}/memos/${id}`, payload).then((r) => r.data),
  remove: (projectId, id) =>
    api.delete(`/projects/${projectId}/memos/${id}`).then((r) => r.data),

  uploadPhotos: (projectId, memoId, files) => {
    const fd = new FormData();
    fd.append('source', 'MEMO');
    fd.append('sourceId', memoId);
    files.forEach((f) => fd.append('photos', f));
    return api.post(`/projects/${projectId}/photos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  removePhoto: (projectId, photoId) =>
    api.delete(`/projects/${projectId}/photos/${photoId}`).then((r) => r.data),
};
