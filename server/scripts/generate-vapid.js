// VAPID 키 쌍 생성 — Web Push 인증용. 최초 1회 실행 후 Railway 환경변수에 등록.
//
// 사용: `node scripts/generate-vapid.js`
// 출력된 PUBLIC/PRIVATE 두 값을 각각 Railway Variables 에 등록 후 이 출력은 즉시 닫기/지우기.
//
// ⚠ Private 키는 자격증명. 채팅·로그·git·이메일 평문 노출 절대 금지.
//   누군가에게 노출됐다면 즉시 본 스크립트 재실행 → 새 키로 교체.
//   (재발급 시 기존 구독은 모두 무효화되어 사용자가 다시 알림 권한 동의 필요)

const webpush = require('web-push');

const keys = webpush.generateVAPIDKeys();

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('VAPID 키 쌍 생성 완료. 아래 두 값을 Railway Variables 에 등록하세요.');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('VAPID_PUBLIC_KEY  =', keys.publicKey);
console.log('VAPID_PRIVATE_KEY =', keys.privateKey);
console.log('VAPID_SUBJECT     = mailto:hello@suplex.kr   (또는 봉기님 이메일)');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚠ Private 키는 자격증명입니다. 등록 후 이 터미널 출력은 즉시 닫으세요.');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
