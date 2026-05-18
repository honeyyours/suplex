// 외부 API 헬스체크 — Anthropic / Cloudinary / Solapi / Resend
// 5분 단위 인메모리 캐시 (어드민 콘솔 진입마다 외부 ping 금지)
// 각 서비스: status (ok | down | not_configured), latencyMs, error

const env = require('../config/env');

const CACHE_TTL_MS = 5 * 60 * 1000; // 5분
let cache = { at: 0, results: null };

const TIMEOUT_MS = 4000;

async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function checkAnthropic() {
  if (!env.anthropic.apiKey) return { status: 'not_configured', note: 'ANTHROPIC_API_KEY 미설정' };
  const start = Date.now();
  try {
    // 모델 리스트는 가벼운 read-only 엔드포인트
    const res = await fetchWithTimeout('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': env.anthropic.apiKey,
        'anthropic-version': '2023-06-01',
      },
    });
    const latencyMs = Date.now() - start;
    if (res.ok) return { status: 'ok', latencyMs };
    return { status: 'down', latencyMs, error: `HTTP ${res.status}` };
  } catch (e) {
    return { status: 'down', latencyMs: Date.now() - start, error: e.message };
  }
}

async function checkCloudinary() {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    return { status: 'not_configured', note: 'CLOUDINARY_* 미설정' };
  }
  const start = Date.now();
  try {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
      secure: true,
    });
    // ping은 별도 엔드포인트로 가벼움
    await cloudinary.api.ping();
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (e) {
    return { status: 'down', latencyMs: Date.now() - start, error: e.message || String(e) };
  }
}

async function checkSolapi() {
  if (!env.solapi.apiKey || !env.solapi.apiSecret) {
    return { status: 'not_configured', note: 'SOLAPI_* 미설정 (카카오 알림톡 미연동)' };
  }
  const start = Date.now();
  try {
    // Solapi 잔액 조회는 가벼운 GET (HMAC 헤더 필요)
    const crypto = require('crypto');
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(16).toString('hex');
    const signature = crypto
      .createHmac('sha256', env.solapi.apiSecret)
      .update(date + salt)
      .digest('hex');
    const auth = `HMAC-SHA256 apiKey=${env.solapi.apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
    const res = await fetchWithTimeout('https://api.solapi.com/cash/v1/balance', {
      headers: { Authorization: auth },
    });
    const latencyMs = Date.now() - start;
    if (res.ok) return { status: 'ok', latencyMs };
    return { status: 'down', latencyMs, error: `HTTP ${res.status}` };
  } catch (e) {
    return { status: 'down', latencyMs: Date.now() - start, error: e.message };
  }
}

async function checkResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: 'not_configured', note: 'RESEND_API_KEY 미설정 (메일 발송 미연동)' };
  const start = Date.now();
  try {
    // POST /emails 에 빈 페이로드 — Sending access 권한 키로도 통과.
    // 401 = 키 무효. 그 외(422/400 = 검증 실패) = 키 유효(실제 발송 X, 페이로드만 거부됨).
    // /domains GET 도, /emails/{id} GET 도 Sending access 키에선 막혀 헬스 false-negative 발생.
    // POST /emails 만이 Sending access 권한 키의 권한 범위라 확인 가능.
    const res = await fetchWithTimeout('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: '{}', // 빈 페이로드 — to/from/subject 검증에 걸려 422 반환 (실제 발송 X)
    });
    const latencyMs = Date.now() - start;
    if (res.status === 401) {
      return { status: 'down', latencyMs, error: 'HTTP 401 (API Key 무효)' };
    }
    // 200/400/422 등 — 키가 인증됐다는 증거
    return { status: 'ok', latencyMs };
  } catch (e) {
    return { status: 'down', latencyMs: Date.now() - start, error: e.message };
  }
}

async function runAllChecks() {
  const [anthropic, cloudinary, solapi, resend] = await Promise.all([
    checkAnthropic(),
    checkCloudinary(),
    checkSolapi(),
    checkResend(),
  ]);
  return {
    checkedAt: new Date().toISOString(),
    anthropic,
    cloudinary,
    solapi,
    resend,
  };
}

async function getHealthCheck({ force = false } = {}) {
  const now = Date.now();
  if (!force && cache.results && now - cache.at < CACHE_TTL_MS) {
    return { ...cache.results, cached: true, cacheAgeMs: now - cache.at };
  }
  const results = await runAllChecks();
  cache = { at: now, results };
  return { ...results, cached: false, cacheAgeMs: 0 };
}

module.exports = { getHealthCheck };
