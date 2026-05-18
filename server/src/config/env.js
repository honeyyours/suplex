require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

// prod에서 누락 시 즉시 throw — 토큰 위조·CORS 차단 등 무음 사고 방지.
// dev에선 폴백으로 부팅 가능하되 console.warn으로 경고.
function requireInProd(key, fallback) {
  const value = process.env[key];
  if (value) return value;
  if (isProd) {
    throw new Error(`[env] ${key} 누락 — production에서는 반드시 설정해야 합니다`);
  }
  console.warn(`[env] ${key} 누락 (dev fallback: ${fallback ? '있음' : '없음'})`);
  return fallback;
}

if (!process.env.DATABASE_URL) {
  if (isProd) throw new Error('[env] DATABASE_URL 누락 — production 필수');
  console.warn('[env] DATABASE_URL 누락 — .env 확인');
}

module.exports = {
  port: Number(process.env.PORT) || 4000,
  nodeEnv,
  jwt: {
    secret: requireInProd('JWT_SECRET', 'dev-secret-change-me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  solapi: {
    apiKey: process.env.SOLAPI_API_KEY || '',
    apiSecret: process.env.SOLAPI_API_SECRET || '',
    sender: process.env.SOLAPI_SENDER || '',
    pfId: process.env.SOLAPI_PFID || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  mail: {
    // Resend (https://resend.com) — 비번 재설정·초대 메일 발송.
    // 미설정 시 메일 전송 코드가 no-op 처리하며 콘솔 경고만 출력 (개발 환경 친화).
    resendApiKey: process.env.RESEND_API_KEY || '',
    // 발신 주소 — 도메인 인증(SPF/DKIM/DMARC) 완료된 주소만 사용 가능.
    from: process.env.MAIL_FROM || 'Suplex <noreply@suplex.kr>',
  },
  // 메일 본문 링크 생성용 — 클라이언트가 호스팅된 도메인. CLIENT_ORIGIN과 별도 (CORS는 다중 origin 허용 가능)
  appBaseUrl: process.env.APP_BASE_URL || (isProd ? 'https://suplex.kr' : 'http://localhost:5173'),
  clientOrigin: parseOrigins(process.env.CLIENT_ORIGIN) || (isProd
    ? (() => { throw new Error('[env] CLIENT_ORIGIN 누락 — production 필수 (예: https://suplex.kr)'); })()
    : 'http://localhost:5173'),
};

function parseOrigins(value) {
  if (!value) return null;
  const list = value.split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length === 0) return null;
  if (list.length === 1) return list[0];
  return list;
}
