import api from './client';

export const purchaseOrdersApi = {
  list: (projectId, status) =>
    api.get(`/projects/${projectId}/purchase-orders`, { params: { status } }).then((r) => r.data),
  create: (projectId, payload) =>
    api.post(`/projects/${projectId}/purchase-orders`, payload).then((r) => r.data),
  update: (projectId, id, payload) =>
    api.patch(`/projects/${projectId}/purchase-orders/${id}`, payload).then((r) => r.data),
  acknowledge: (projectId, id) =>
    api.post(`/projects/${projectId}/purchase-orders/${id}/acknowledge`).then((r) => r.data),
  remove: (projectId, id) =>
    api.delete(`/projects/${projectId}/purchase-orders/${id}`).then((r) => r.data),
};

// 회사 전체 (글로벌)
export const ordersGlobalApi = {
  list: (params = {}) =>
    api.get('/purchase-orders', { params }).then((r) => r.data),
  pendingModels: (params = {}) =>
    api.get('/purchase-orders/pending-models', { params }).then((r) => r.data),
  summary: (params = {}) =>
    api.get('/purchase-orders/summary', { params }).then((r) => r.data),
};

export const PO_STATUS_META = {
  PENDING:   { label: '대기중',   color: 'bg-amber-100 text-amber-800',     icon: '⏳' },
  ORDERED:   { label: '발주완료', color: 'bg-sky-100 text-sky-700',         icon: '📦' },
  RECEIVED:  { label: '수령',     color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
  CANCELLED: { label: '취소',     color: 'bg-gray-100 text-gray-500',       icon: '⊘'  },
};
