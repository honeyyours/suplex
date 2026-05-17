// FREE 등급 카톡 복사 워터마크 — 바이럴 진입로
// Dropbox·Calendly 패턴. 무료 사용자의 카톡 복사 출구에 짧은 푸터 자동 추가.
// STARTER+ 등급은 그대로 통과. 가격정책 v7 정합 (docs/가격정책.md).

const FOOTER = '\n\n📋 수플렉스로 정리 — suplex.kr';

export function appendKakaoFooter(text, plan) {
  if (!text) return text;
  if (plan && plan !== 'FREE') return text;
  return text + FOOTER;
}
