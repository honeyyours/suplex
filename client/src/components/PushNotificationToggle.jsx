import { useEffect, useState } from 'react';
import api from '../api/client';

// Web Push 알림 ON/OFF 토글.
// 사용자가 권한 동의 + 서버 구독 등록 = ON.
// iOS 사용자에겐 "홈 화면 추가" 필수 안내 표시.
// 권한 거부 시 브라우저 설정에서 직접 풀어야 한다는 안내 표시.

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function isStandalone() {
  // iOS: navigator.standalone, 그 외: display-mode media query
  return window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;
}
function supportsPush() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// base64url → Uint8Array (VAPID public key 변환)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function PushNotificationToggle() {
  const [permission, setPermission] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
  const [subscribed, setSubscribed] = useState(false); // 이 기기가 구독돼 있는지
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const canPush = supportsPush();
  const iosNeedInstall = isIos() && !isStandalone();

  useEffect(() => {
    if (!canPush) { setLoading(false); return; }
    let alive = true;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (alive) setSubscribed(!!sub);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [canPush]);

  async function enable() {
    setMsg('');
    setBusy(true);
    try {
      // 1) 권한 요청
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setMsg(perm === 'denied'
          ? '알림 권한이 차단되었습니다. 브라우저 설정에서 직접 허용해주세요.'
          : '권한 동의가 필요합니다.');
        return;
      }

      // 2) 서버에서 VAPID 공개키 받기
      const { data: keyData } = await api.get('/push/vapid-public-key');

      // 3) PushManager 구독
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      // 4) 서버에 구독 정보 전송
      const json = sub.toJSON();
      await api.post('/push/subscribe', {
        endpoint: json.endpoint,
        keys: json.keys,
      });

      setSubscribed(true);
      setMsg('알림이 켜졌습니다.');
    } catch (e) {
      console.error(e);
      setMsg('알림 설정 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setMsg('');
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.post('/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {});
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMsg('알림이 꺼졌습니다.');
    } catch (e) {
      setMsg('알림 해제 실패: ' + e.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setMsg('');
    setBusy(true);
    try {
      const { data } = await api.post('/push/test');
      if (data.sent > 0) {
        setMsg(`테스트 알림 발송됨 (${data.sent}개 기기). 잠시 후 알림이 도착합니다.`);
      } else {
        setMsg('구독된 기기가 없습니다. 먼저 알림을 켜주세요.');
      }
    } catch (e) {
      setMsg('테스트 실패: ' + (e.response?.data?.error || e.message));
    } finally {
      setBusy(false);
    }
  }

  if (!canPush) {
    return (
      <div className="py-3 border-b">
        <div className="text-sm font-medium">푸시 알림</div>
        <div className="text-xs text-gray-500 mt-1">이 브라우저는 푸시 알림을 지원하지 않습니다.</div>
      </div>
    );
  }

  return (
    <div className="py-3 border-b">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">푸시 알림 (이 기기)</div>
        {!loading && (
          subscribed ? (
            <button
              onClick={disable}
              disabled={busy}
              className="text-xs px-3 py-1.5 border border-rose-300 text-rose-600 rounded hover:bg-rose-50 disabled:opacity-50"
            >{busy ? '...' : '알림 끄기'}</button>
          ) : (
            <button
              onClick={enable}
              disabled={busy || iosNeedInstall}
              className="text-xs px-3 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-50"
            >{busy ? '...' : '알림 켜기'}</button>
          )
        )}
      </div>

      <div className="text-xs text-gray-500 leading-relaxed">
        체크리스트 D-day·일정 변경 등을 폰 잠금화면에 알려드립니다.
      </div>

      {iosNeedInstall && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed">
          <b>iOS 사용자</b>: 알림을 받으려면 먼저 홈 화면에 추가해주세요.
          <br />Safari 하단 공유 버튼 → "홈 화면에 추가" → 추가된 아이콘으로 다시 접속하면 알림 켜기 버튼이 활성화됩니다.
        </div>
      )}

      {permission === 'denied' && (
        <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 leading-relaxed">
          알림 권한이 차단되어 있습니다. 브라우저 주소창 왼쪽 자물쇠 아이콘 → 알림 → 허용으로 풀어주세요.
        </div>
      )}

      {subscribed && (
        <div className="mt-2">
          <button
            onClick={sendTest}
            disabled={busy}
            className="text-xs px-3 py-1 border border-navy-300 text-navy-700 rounded hover:bg-navy-50 disabled:opacity-50"
          >테스트 알림 보내기</button>
        </div>
      )}

      {msg && <div className="mt-2 text-xs text-gray-600">{msg}</div>}
    </div>
  );
}
