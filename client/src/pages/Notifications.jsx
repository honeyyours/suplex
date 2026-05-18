import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';

// 인앱 알림 센터 페이지 — 최근 30일, 최신순.
// 클릭 시 url 이동 + 자동 read 처리. "모두 읽음" + 단건 삭제 가능.

const TYPE_META = {
  CHECKLIST_DDAY: { label: '체크리스트', icon: '📋' },
  SCHEDULE_CHANGE: { label: '일정', icon: '📅' },
  MEMO_MENTION: { label: '메모', icon: '✏️' },
  QUOTE_FINALIZED: { label: '견적', icon: '💰' },
  ORDER_RESPONSE: { label: '발주', icon: '📦' },
  SYSTEM: { label: '시스템', icon: '🔔' },
};

export default function Notifications() {
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function load() {
    try {
      const list = await notificationsApi.list();
      setItems(list);
    } catch (e) {
      console.error(e);
      setItems([]);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleClick(n) {
    if (!n.isRead) {
      try { await notificationsApi.read(n.id); } catch {}
      setItems((prev) => prev?.map((x) => x.id === n.id ? { ...x, isRead: true } : x) || prev);
    }
    if (n.url) navigate(n.url);
  }

  async function handleReadAll() {
    setBusy(true);
    try {
      await notificationsApi.readAll();
      setItems((prev) => prev?.map((x) => ({ ...x, isRead: true })) || prev);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id, e) {
    e.stopPropagation();
    if (!confirm('이 알림을 삭제하시겠어요?')) return;
    try {
      await notificationsApi.remove(id);
      setItems((prev) => prev?.filter((x) => x.id !== id) || prev);
    } catch (err) {
      alert('삭제 실패: ' + (err.response?.data?.error || err.message));
    }
  }

  const unreadCount = items?.filter((x) => !x.isRead).length || 0;

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-navy-800 dark:text-navy-200">알림</h1>
        {unreadCount > 0 && (
          <button
            onClick={handleReadAll}
            disabled={busy}
            className="text-xs px-3 py-1.5 border border-navy-300 text-navy-700 rounded hover:bg-navy-50 disabled:opacity-50"
          >모두 읽음 처리 ({unreadCount})</button>
        )}
      </div>

      {items === null && (
        <p className="text-sm text-gray-400 text-center py-12">불러오는 중...</p>
      )}

      {items?.length === 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 p-8 text-center">
          <div className="text-4xl mb-3">🔕</div>
          <p className="text-sm text-gray-500">아직 알림이 없습니다</p>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            체크리스트 D-day, 일정 변경 등이 발생하면 여기에 표시됩니다.
            <br />
            폰 푸시 알림을 받으려면 <Link to="/settings" className="text-navy-700 underline">설정</Link> 에서 "푸시 알림 (이 기기)" 켜기.
          </p>
        </div>
      )}

      {items && items.length > 0 && (
        <ul className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 divide-y dark:divide-slate-700">
          {items.map((n) => {
            const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
            return (
              <li
                key={n.id}
                onClick={() => handleClick(n)}
                className={`flex gap-3 p-3 sm:p-4 cursor-pointer transition ${
                  n.isRead
                    ? 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
                    : 'bg-amber-50/40 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                }`}
              >
                <div className="text-lg flex-shrink-0">{meta.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`text-sm ${n.isRead ? 'font-medium text-gray-700 dark:text-gray-300' : 'font-bold text-gray-900 dark:text-gray-100'}`}>
                      {n.title}
                    </span>
                    {!n.isRead && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0" />}
                  </div>
                  {n.body && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line line-clamp-2">
                      {n.body}
                    </p>
                  )}
                  <div className="text-[11px] text-gray-400 mt-1">
                    {meta.label} · {formatTime(n.createdAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(n.id, e)}
                  className="self-start text-gray-300 hover:text-rose-500 text-xs px-1"
                  title="삭제"
                >✕</button>
              </li>
            );
          })}
        </ul>
      )}

      {items && items.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-4">최근 30일 알림만 표시됩니다</p>
      )}
    </div>
  );
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}
