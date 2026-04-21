import api from './client';

export const backupApi = {
  exportProject: (projectId) =>
    api.get(`/backup/export`, { params: { projectId } }).then((r) => r.data),
  exportCompany: () =>
    api.get(`/backup/export`).then((r) => r.data),
  import: ({ data, mode = 'new', targetProjectId }) =>
    api.post(`/backup/import`, { data, mode, targetProjectId }).then((r) => r.data),
};

export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
