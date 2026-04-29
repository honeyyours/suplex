import api from './client';

// 회사 단위 견적 가이드 — 공정별 회사 내부 메모 (화면 전용, PDF/프린트 X)
export const companyPhaseTipsApi = {
  list: () => api.get('/company-phase-tips').then((r) => r.data),
  upsert: (phase, body) =>
    api.put('/company-phase-tips', { phase, body }).then((r) => r.data),
  remove: (phase) =>
    api.delete(`/company-phase-tips/${encodeURIComponent(phase)}`).then((r) => r.data),
};

// 'GENERAL' = 전체 공통(공정 무관) 메모
export const GENERAL_PHASE = 'GENERAL';
