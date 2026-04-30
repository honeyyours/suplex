import api from './client';

export const expensesApi = {
  list: (params = {}) =>
    api.get('/expenses', { params }).then((r) => r.data),
  summary: () =>
    api.get('/expenses/summary').then((r) => r.data),
  create: (payload) =>
    api.post('/expenses', payload).then((r) => r.data),
  bulk: (items) =>
    api.post('/expenses/bulk', { items }).then((r) => r.data),
  update: (id, payload) =>
    api.patch(`/expenses/${id}`, payload).then((r) => r.data),
  remove: (id) =>
    api.delete(`/expenses/${id}`).then((r) => r.data),
  // 출구정리 추론엔진 — 통장 거래 1건 → 발주 매칭 후보
  inferenceCandidates: (txn) =>
    api.post('/expenses/inference-candidates', txn).then((r) => r.data),
};

// 거래 종류 메타
export const EXPENSE_TYPE_META = {
  EXPENSE:  { label: '지출', color: 'bg-rose-50 text-rose-700 border-rose-200',         sign: '-' },
  INCOME:   { label: '매출', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', sign: '+' },
  TRANSFER: { label: '이체', color: 'bg-gray-100 text-gray-600 border-gray-200',     sign: '↔' },
};
export const EXPENSE_TYPE_KEYS = Object.keys(EXPENSE_TYPE_META);

export const PAYMENT_METHOD_META = {
  CASH:          { label: '현금' },
  CARD:          { label: '카드' },
  BANK_TRANSFER: { label: '계좌이체' },
  OTHER:         { label: '기타' },
};
export const PAYMENT_METHOD_KEYS = Object.keys(PAYMENT_METHOD_META);
