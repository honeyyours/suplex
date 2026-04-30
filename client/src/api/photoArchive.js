import api from './client';

export const photoArchiveApi = {
  summary: (projectId) =>
    api.get(`/projects/${projectId}/photo-archive/summary`).then((r) => r.data),

  // 큰 ZIP은 axios로 blob 받아서 클라이언트에서 다운로드 트리거.
  // (auth는 Bearer 헤더라서 a[href]로는 호출 불가)
  async download(projectId, suggestedFilename) {
    const res = await api.get(`/projects/${projectId}/photo-archive/download.zip`, {
      responseType: 'blob',
    });
    const blob = res.data;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedFilename || `suplex_photos_${projectId}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  purge: (projectId) =>
    api
      .post(`/projects/${projectId}/photo-archive/purge`, { confirmDownloaded: true })
      .then((r) => r.data),
};
