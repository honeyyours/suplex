import api from './client';

export const accountCodesApi = {
  list: (params = {}) => api.get('/account-codes', { params }).then((r) => r.data),
  create: (payload) => api.post('/account-codes', payload).then((r) => r.data),
  update: (id, payload) => api.patch(`/account-codes/${id}`, payload).then((r) => r.data),
  remove: (id) => api.delete(`/account-codes/${id}`).then((r) => r.data),
};

// 그룹별 색상 (UI 표시용)
export const ACCOUNT_GROUP_COLORS = {
  '본사':   'bg-amber-100 text-amber-800',
  '현장':   'bg-sky-100 text-sky-700',
  '대표':   'bg-violet-100 text-violet-700',
  '매출':   'bg-emerald-100 text-emerald-700',
  '자금':   'bg-gray-100 text-gray-600',
  '기타':   'bg-pink-100 text-pink-700',
};

export function accountColor(groupName) {
  return ACCOUNT_GROUP_COLORS[groupName] || 'bg-gray-100 text-gray-600';
}
