import api from './client';

export const phasesApi = {
  // 회사가 사용 중인 공정 목록 (기본 10개 + 추가분)
  list: () => api.get('/phases').then((r) => r.data),
  // 공정 cascade 삭제 (키워드/D-N/어드바이스), 일정 entries는 보존
  remove: (phase) => api.delete(`/phases/${encodeURIComponent(phase)}`).then((r) => r.data),
};
