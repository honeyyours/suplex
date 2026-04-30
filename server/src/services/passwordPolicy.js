// 베타용 약한 비번 패턴 가드 (정식 출시 시 zxcvbn 도입 검토).
// 8자 이상 + 다음 패턴 차단:
//  - 모두 같은 문자 (00000000, aaaaaaaa)
//  - 연속 숫자/문자 (12345678, 87654321, abcdefgh)
//  - 흔한 약한 문자열
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

// 통과하면 null, 실패하면 사용자용 한국어 사유 반환
function checkPasswordPolicy(password) {
  if (!password || typeof password !== 'string') return '비밀번호를 입력해주세요';
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다';
  if (allSameChar(password)) return '같은 문자만 반복된 비밀번호는 사용할 수 없습니다';
  if (isSequential(password)) return '연속된 문자·숫자만으로 된 비밀번호는 사용할 수 없습니다';
  if (FORBIDDEN_LIST.includes(password.toLowerCase())) {
    return '너무 흔한 비밀번호입니다. 다른 비밀번호를 사용해주세요';
  }
  return null;
}

module.exports = { checkPasswordPolicy };
