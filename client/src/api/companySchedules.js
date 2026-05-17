import api from './client';

// 팀 캘린더(회사 일정) API — 2026-05-17 신설
// 봉기님 합의: 회사 자체 운영 일정·견적미팅·사무실미팅 등을 별도 메뉴에서 관리.
// projectId 선택 — 연결 시 프로젝트 일정에도 함께 노출 (companyWide=true).
export const companySchedulesApi = {
  list: ({ from, to, assigneeId } = {}) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (assigneeId) params.assigneeId = assigneeId;
    return api.get('/company-schedules', { params }).then((r) => r.data);
  },
  create: (payload) =>
    api.post('/company-schedules', payload).then((r) => r.data),
  update: (id, payload) =>
    api.patch(`/company-schedules/${id}`, payload).then((r) => r.data),
  remove: (id) =>
    api.delete(`/company-schedules/${id}`).then((r) => r.data),
};
