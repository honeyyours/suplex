// 메일 발송 서비스 — Resend (https://resend.com) 기반.
// RESEND_API_KEY 미설정 시 발송 코드가 no-op 로 처리되어 dev 환경/외부 인프라 미준비 환경에서도 부팅 안전.
// 본문은 한국어, 매뉴얼톤(사실 기반 담백)·분쟁표현금지 규칙 준수.

const { Resend } = require('resend');
const env = require('../config/env');

let resendClient = null;
function getClient() {
  if (resendClient) return resendClient;
  if (!env.mail.resendApiKey) return null;
  resendClient = new Resend(env.mail.resendApiKey);
  return resendClient;
}

function isConfigured() {
  return !!env.mail.resendApiKey;
}

// 내부 공통 발송기. 성공/실패 모두 로깅. 호출부에서 await 하지 않아도 되도록 try/catch 처리.
async function send({ to, subject, html, text }) {
  if (!isConfigured()) {
    console.warn('[mail] RESEND_API_KEY 미설정 — 메일 발송 건너뜀:', { to, subject });
    return { ok: false, skipped: true };
  }
  try {
    const client = getClient();
    const result = await client.emails.send({
      from: env.mail.from,
      to,
      subject,
      html,
      text,
    });
    if (result.error) {
      console.error('[mail] Resend 오류:', result.error);
      return { ok: false, error: result.error };
    }
    return { ok: true, id: result.data?.id };
  } catch (e) {
    console.error('[mail] 발송 예외:', e?.message || e);
    return { ok: false, error: e };
  }
}

// 비밀번호 재설정 메일 — 링크 1회용·1시간 유효.
async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const subject = '[Suplex] 비밀번호 재설정 안내';
  const greetingName = name ? `${name}님,` : '안녕하세요,';
  const text = [
    greetingName,
    '',
    'Suplex 비밀번호 재설정 요청을 받았습니다.',
    '아래 링크를 눌러 새 비밀번호를 설정해주세요. 링크는 1시간 동안 유효하며, 한 번만 사용할 수 있습니다.',
    '',
    resetUrl,
    '',
    '본인이 요청하지 않았다면 이 메일을 무시해주셔도 됩니다. 비밀번호는 변경되지 않습니다.',
    '',
    '— Suplex',
    'https://suplex.kr',
  ].join('\n');
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="color:#1e3a8a;margin:0 0 16px;font-size:20px;">비밀번호 재설정 안내</h2>
      <p style="margin:0 0 12px;line-height:1.6;">${escapeHtml(greetingName)}</p>
      <p style="margin:0 0 12px;line-height:1.6;">Suplex 비밀번호 재설정 요청을 받았습니다.</p>
      <p style="margin:0 0 20px;line-height:1.6;">아래 버튼을 눌러 새 비밀번호를 설정해주세요. 링크는 <b>1시간 동안 유효</b>하며, 한 번만 사용할 수 있습니다.</p>
      <p style="margin:0 0 24px;">
        <a href="${escapeHtml(resetUrl)}"
           style="display:inline-block;background:#1e3a8a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:600;">
          비밀번호 재설정
        </a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">버튼이 작동하지 않으면 아래 주소를 복사해 브라우저에 붙여넣어주세요.</p>
      <p style="margin:0 0 24px;font-size:13px;color:#6b7280;word-break:break-all;">${escapeHtml(resetUrl)}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
        본인이 요청하지 않았다면 이 메일을 무시해주셔도 됩니다. 비밀번호는 변경되지 않습니다.
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">— Suplex · <a href="https://suplex.kr" style="color:#6b7280;">suplex.kr</a></p>
    </div>
  `;
  return send({ to, subject, html, text });
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  isConfigured,
  sendPasswordResetEmail,
};
