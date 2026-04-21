import api from './client';

export const reportsApi = {
  list: (projectId, { from, to } = {}) =>
    api.get(`/projects/${projectId}/reports`, { params: { from, to } }).then((r) => r.data),
  create: (projectId, payload) =>
    api.post(`/projects/${projectId}/reports`, payload).then((r) => r.data),
  update: (projectId, id, payload) =>
    api.patch(`/projects/${projectId}/reports/${id}`, payload).then((r) => r.data),
  remove: (projectId, id) =>
    api.delete(`/projects/${projectId}/reports/${id}`).then((r) => r.data),
};

export const issuesApi = {
  list: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/issues`, { params }).then((r) => r.data),
  create: (projectId, payload) =>
    api.post(`/projects/${projectId}/issues`, payload).then((r) => r.data),
  update: (projectId, id, payload) =>
    api.patch(`/projects/${projectId}/issues/${id}`, payload).then((r) => r.data),
  remove: (projectId, id) =>
    api.delete(`/projects/${projectId}/issues/${id}`).then((r) => r.data),
};

export const materialRequestsApi = {
  list: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/material-requests`, { params }).then((r) => r.data),
  create: (projectId, payload) =>
    api.post(`/projects/${projectId}/material-requests`, payload).then((r) => r.data),
  update: (projectId, id, payload) =>
    api.patch(`/projects/${projectId}/material-requests/${id}`, payload).then((r) => r.data),
  remove: (projectId, id) =>
    api.delete(`/projects/${projectId}/material-requests/${id}`).then((r) => r.data),
};

export const photosApi = {
  list: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/photos`, { params }).then((r) => r.data),
  upload: (projectId, { source, sourceId, caption, files }) => {
    const fd = new FormData();
    fd.append('source', source);
    fd.append('sourceId', sourceId);
    if (caption) fd.append('caption', caption);
    files.forEach((f) => fd.append('photos', f));
    return api.post(`/projects/${projectId}/photos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  remove: (projectId, photoId) =>
    api.delete(`/projects/${projectId}/photos/${photoId}`).then((r) => r.data),
};

// ============================================
// 메타/라벨
// ============================================

export const ISSUE_TYPE_META = {
  MATERIAL_DEFECT:  { label: '자재불량',   color: 'bg-red-100 text-red-700' },
  DIMENSION_ERROR:  { label: '치수오류',   color: 'bg-orange-100 text-orange-700' },
  CUSTOMER_CHANGE:  { label: '고객변경',   color: 'bg-sky-100 text-sky-700' },
  STRUCTURAL:       { label: '구조문제',   color: 'bg-amber-100 text-amber-800' },
  WEATHER_DELAY:    { label: '날씨지연',   color: 'bg-violet-100 text-violet-700' },
  OTHER:            { label: '기타',       color: 'bg-gray-100 text-gray-700' },
};
export const ISSUE_TYPE_KEYS = Object.keys(ISSUE_TYPE_META);

export const URGENCY_META = {
  NORMAL:   { label: '일반',   color: 'bg-gray-100 text-gray-700',    dot: 'bg-gray-400' },
  WARNING:  { label: '주의',   color: 'bg-amber-100 text-amber-800',  dot: 'bg-amber-500' },
  CRITICAL: { label: '긴급',   color: 'bg-red-600 text-white',        dot: 'bg-red-600' },
};
export const URGENCY_KEYS = Object.keys(URGENCY_META);

export const REQUEST_STATUS_META = {
  PENDING:   { label: '요청됨', color: 'bg-amber-100 text-amber-800' },
  ORDERED:   { label: '발주됨', color: 'bg-sky-100 text-sky-700' },
  DELIVERED: { label: '납품됨', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: '취소',   color: 'bg-gray-200 text-gray-700' },
};
export const REQUEST_STATUS_KEYS = Object.keys(REQUEST_STATUS_META);

export const PHOTO_SOURCE_META = {
  REPORT:           { label: '작업 보고', color: 'bg-navy-100 text-navy-700' },
  ISSUE:            { label: '이슈',     color: 'bg-red-100 text-red-700' },
  MATERIAL_REQUEST: { label: '자재 요청', color: 'bg-amber-100 text-amber-800' },
};

export const CATEGORIES = [
  '철거', '목공', '전기', '설비', '타일', '도배', '도장', '필름', '마루', '준공', '기타',
];
