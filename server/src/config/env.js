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
