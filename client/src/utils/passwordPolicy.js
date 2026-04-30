// 클라이언트 가드 — 서비스 도달 전 빠른 안내. 서버 services/passwordPolicy.js와 룰 동일.
const FORBIDDEN_LIST = [
  'password', 'qwerty', 'abc12345', 'asdf1234', 'admin123',
  '1q2w3e4r', 'qwer1234', 'suplex', 'suplex01',
];

function allSameChar(s) {
  return s.length > 0 && [...s].every((c) => c === s[0]);
}

function isSequential(s) {
  if (s.length < 4) return false;
  const codes = [...s].map((c) => c.charCodeAt(0));
  let asc = true, desc = true;
  for (let i = 1; i < codes.length; i++) {
    if (codes[i] - codes[i - 1] !== 1) asc = false;
    if (codes[i - 1] - codes[i] !== 1) desc = false;
  }
  return asc || desc;
}

export function checkPasswordPolicy(password) {
  if (!password) return '비밀번호를 입력해주세요';
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다';
  if (allSameChar(password)) return '같은 문자만 반복된 비밀번호는 사용할 수 없습니다';
  if (isSequential(password)) return '연속된 문자·숫자만으로 된 비밀번호는 사용할 수 없습니다';
  if (FORBIDDEN_LIST.includes(password.toLowerCase())) {
    return '너무 흔한 비밀번호입니다. 다른 비밀번호를 사용해주세요';
  }
  return null;
}
