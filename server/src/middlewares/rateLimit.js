// 베타 시범 직전 rate limiting — 무차별 대입·자동화 봇 1차 방어.
// app.set('trust proxy', 1) 가 app.js에 설정돼 있어야 req.ip가 실제 클라이언트 IP를 가리킴.
// 한국어 메시지로 응답해서 사용자가 이해할 수 있게.

const rateLimit = require('express-rate-limit');

function makeLimiter({ windowMs, max, kind }) {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: kind === 'login', // 로그인 성공은 카운트 X — 정상 사용자 보호
    message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요' },
  });
}

// 로그인 — IP당 분당 5회 (성공은 카운트 안 함)
const loginLimiter = makeLimiter({ windowMs: 60 * 1000, max: 5, kind: 'login' });

// 회원가입 — IP당 분당 3회. 베타엔 어차피 슈퍼어드민 승인 단계가 있어 1차 방어용.
const signupLimiter = makeLimiter({ windowMs: 60 * 1000, max: 3, kind: 'signup' });

// 초대 토큰 조회 — IP당 분당 30회. 토큰 brute-force 방지(7일 유효 + 6자+ 토큰이라 실효성 자체는 낮으나 일관성).
const inviteTokenLimiter = makeLimiter({ windowMs: 60 * 1000, max: 30, kind: 'invite' });

// 비밀번호 변경 — IP당 5분당 5회. 본인 비번 변경에도 brute-force 시도 가능성.
const passwordChangeLimiter = makeLimiter({ windowMs: 5 * 60 * 1000, max: 5, kind: 'password' });

module.exports = {
  loginLimiter,
  signupLimiter,
  inviteTokenLimiter,
  passwordChangeLimiter,
};
