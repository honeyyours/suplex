// 클라이언트 가드 — 빈 값만 거절. 강도 정책은 베타 단계에서 제거 (2026-05-18).
export function checkPasswordPolicy(password) {
  if (!password) return '비밀번호를 입력해주세요';
  return null;
}
