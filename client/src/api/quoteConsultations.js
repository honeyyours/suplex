import api from './client';

export const quoteConsultationsApi = {
  list: (projectId) => api.get(`/projects/${projectId}/quote-consultations`).then((r) => r.data),
  create: (projectId, payload) => api.post(`/projects/${projectId}/quote-consultations`, payload).then((r) => r.data),
  update: (projectId, id, payload) => api.patch(`/projects/${projectId}/quote-consultations/${id}`, payload).then((r) => r.data),
  remove: (projectId, id) => api.delete(`/projects/${projectId}/quote-consultations/${id}`).then((r) => r.data),
};

// 채널·반응·주제 메타 (UI 표시용)
export const CHANNELS = [
  { value: 'PHONE',   label: '전화', icon: '📞' },
  { value: 'KAKAO',   label: '카톡', icon: '💬' },
  { value: 'MEETING', label: '미팅', icon: '🤝' },
  { value: 'EMAIL',   label: '이메일', icon: '📧' },
  { value: 'ZOOM',    label: '줌',   icon: '💻' },
];

export const REACTIONS = [
  { value: 'POSITIVE', label: '긍정', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'NEUTRAL',  label: '중립', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'NEGATIVE', label: '부정', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { value: 'DECIDED',  label: '결정', color: 'bg-violet-100 text-violet-700 border-violet-200' },
];

// 표준 주제 11종 (자유 입력도 가능 — datalist 자동완성용)
export const TOPIC_SUGGESTIONS = [
  '첫 상담',
  '현장 답사',
  '1차 견적 설명',
  '가격 협상',
  '항목 변경 요청',
  '자재 변경 요청',
  '일정 조정',
  '결제 방식 협의',
  '계약 협의',
  'A/S·하자',
  '기타',
];

export function channelMeta(value) {
  return CHANNELS.find((c) => c.value === value) || { label: value, icon: '·' };
}
export function reactionMeta(value) {
  return REACTIONS.find((r) => r.value === value);
}
