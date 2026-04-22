import api from './client';

export const activityApi = {
  list: ({ days = 7, limit = 30 } = {}) =>
    api.get('/activity', { params: { days, limit } }).then((r) => r.data),
};

export const ACTIVITY_META = {
  SCHEDULE:  { label: '일정', icon: '📅', color: 'bg-navy-50 text-navy-700' },
  REPORT:    { label: '보고', icon: '📷', color: 'bg-sky-50 text-sky-700' },
  EXPENSE:   { label: '지출', icon: '💰', color: 'bg-amber-50 text-amber-700' },
  CHECKLIST: { label: '체크', icon: '✅', color: 'bg-emerald-50 text-emerald-700' },
};
