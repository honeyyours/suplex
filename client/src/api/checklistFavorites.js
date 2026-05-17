import api from './client';

// 체크리스트 즐겨찾기 API — 회사 단위 마스터 (2026-05-17 신설)
// 봉기님 요청: 회사가 반복적으로 챙기는 항목을 회사 자산으로 저장 → 새 프로젝트에 일괄 적용.
export const checklistFavoritesApi = {
  list: () => api.get('/checklist-favorites').then((r) => r.data),
  create: (payload) =>
    api.post('/checklist-favorites', payload).then((r) => r.data),
  update: (id, payload) =>
    api.patch(`/checklist-favorites/${id}`, payload).then((r) => r.data),
  remove: (id) =>
    api.delete(`/checklist-favorites/${id}`).then((r) => r.data),
  applyToProject: (projectId, favoriteIds) =>
    api.post(`/checklist-favorites/apply/${projectId}`, { favoriteIds }).then((r) => r.data),
};
