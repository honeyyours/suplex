// TOTP 헬퍼 — 슈퍼어드민 2FA 전용
// otplib + qrcode 사용. 시크릿 생성·코드 검증·QR data URL·백업 코드 생성/검증.
const crypto = require('crypto');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');

// 시간 윈도우 1단계(±30초) 허용 — 시계 오차 흡수
authenticator.options = { window: 1 };

const ISSUER = 'Suplex Admin';

function generateSecret() {
  return authenticator.generateSecret();
}

function buildOtpauthUrl(email, secret) {
  return authenticator.keyuri(email, ISSUER, secret);
}

async function buildQrDataUrl(otpauthUrl) {
  return QRCode.toDataURL(otpauthUrl, { margin: 1, scale: 6 });
}

function verifyCode(secret, code) {
  if (!secret || !code) return false;
  const clean = String(code).replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  try {
    return authenticator.verify({ token: clean, secret });
  } catch {
    return false;
  }
}

// 백업 코드 — 영문+숫자 10자 (대시 1개 들어가서 10-자 형태). 8개 생성.
function generateBackupCodes(count = 8) {
  const codes = [];
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < count; i++) {
    let code = '';
    const bytes = crypto.randomBytes(10);
    for (let j = 0; j < 10; j++) code += chars[bytes[j] % chars.length];
    // 가독성: xxxxx-xxxxx
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  return codes;
}

function hashBackupCode(code) {
  return crypto.createHash('sha256').update(code.trim().toLowerCase()).digest('hex');
}

// 입력된 코드가 hashes 중 하나와 일치하면 일치한 hash 반환 (없으면 null)
function findMatchingBackupHash(hashes, inputCode) {
  if (!inputCode) return null;
  const target = hashBackupCode(inputCode);
  return hashes.includes(target) ? target : null;
}

module.exports = {
  ISSUER,
  generateSecret,
  buildOtpauthUrl,
  buildQrDataUrl,
  verifyCode,
  generateBackupCodes,
  hashBackupCode,
  findMatchingBackupHash,
};
