import api from './client';

export const phasesApi = {
  // 회사가 사용 중인 공정 목록 (기본 10개 + 추가분)
  list: () => api.get('/phases').then((r) => r.data),
};
