import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';

// 헤더 우측 벨 아이콘 + 미읽음 카운트 점.
// 1분 주기 polling. 페이지 이동 시 즉시 재조회.
// 클릭 시 /notifications 로 이동.

const POLL_INTERVAL_MS = 60 * 1000; // 1분

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    let timer = null;

    async function fetchCount() {
      try {
        const c = await notificationsApi.unreadCount();
        if (alive) setCount(c);
      } catch {
        // 401·503 등은 조용히 무시 (인터셉터가 처리)
      }
    }

    fetchCount();
    timer = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      alive = false;
      if (timer) clearInterval(timer);
    };
  }, [location.pathname]); // 페이지 이동 시 재조회 (알림 페이지 들어가서 읽음 처리한 직후 등)

  const display = count > 99 ? '99+' : count > 0 ? String(count) : null;

  return (
    <Link
      to="/notifications"
      title={count > 0 ? `읽지 않은 알림 ${count}개` : '알림'}
      className="relative inline-flex items-center justify-center text-navy-100 hover:text-white text-base px-1.5 py-1 rounded hover:bg-navy-700/60 transition leading-none"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {display !== null && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full leading-none">
          {display}
        </span>
      )}
    </Link>
  );
}
