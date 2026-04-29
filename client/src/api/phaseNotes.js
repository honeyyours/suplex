import api from './client';

export const phaseNotesApi = {
  list: (projectId) => api.get(`/projects/${projectId}/phase-notes`).then((r) => r.data),
  upsert: (projectId, phase, body) =>
    api.put(`/projects/${projectId}/phase-notes`, { phase, body }).then((r) => r.data),
  remove: (projectId, phase) =>
    api.delete(`/projects/${projectId}/phase-notes/${encodeURIComponent(phase)}`).then((r) => r.data),
};

// 기본 메모 sentinel — phase에 'GENERAL' 박아 공정 메모와 같은 모델로 처리
export const GENERAL_PHASE = 'GENERAL';

// 역할 한글 라벨 (작성자 직책 표시용)
export const ROLE_LABEL = {
  OWNER: '대표',
  DESIGNER: '디자인팀',
  FIELD: '현장팀',
};
