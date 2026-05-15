// 홈 최상단 "3일 안에 할 일" 카드 — 결정론 규칙 기반(AI 아님).
// 사용자 역할로 노출 항목이 분기됨 (서버에서 필터):
//   - 현장팀(FIELD): 현장 일정 + 발주(PO + 체크리스트)
//   - 디자인팀(DESIGNER): 마감재 미확정 + 발주(PO + 체크리스트)
//   - 대표(OWNER): 모두
// 4개 노출, 나머지는 "더 보기" 토글.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';

const VISIBLE = 4;

const LEVEL_STYLE = {
  overdue: { tagBg: 'bg-rose-100', tagText: 'text-rose-700', tagBorder: 'border-rose-200' },
  today:   { tagBg: 'bg-amber-100', tagText: 'text-amber-800', tagBorder: 'border-amber-200' },
  soon:    { tagBg: 'bg-orange-100', tagText: 'text-orange-800', tagBorder: 'border-orange-200' },
  review:  { tagBg: 'bg-sky-100', tagText: 'text-sky-700', tagBorder: 'border-sky-200' },
};

function KindIcon({ kind, className = 'w-4 h-4' }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (kind) {
    case 'checklist':
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 10l3 3 5-6" /></svg>;
    case 'order':
      return <svg {...common}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /></svg>;
    case 'schedule':
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>;
    case 'material':
      return <svg {...common}><path d="M4 7h16M4 12h16M4 17h10" /></svg>;
    default:
      return null;
  }
}

export default function HomeTodayActions() {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'today-actions'],
    queryFn: dashboardApi.todayActions,
    staleTime: 60_000,
  });
  const items = data?.items || [];
  const visible = expanded ? items : items.slice(0, VISIBLE);
  const remaining = items.length - VISIBLE;

  return (
    <section className="bg-white rounded-xl border border-gray-200 p-3 sm:p-5">
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h2 className="text-base sm:text-lg font-bold text-navy-800 flex items-baseline gap-2">
          <span>3일 안에 할 일</span>
          {items.length > 0 && (
            <span className="text-xs font-normal text-gray-500 tabular-nums">{items.length}건</span>
          )}
        </h2>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-3">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="py-6 text-center text-sm text-gray-500">
          3일 안에 챙길 일이 없어요.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {visible.map((it) => (
            <ActionRow key={it.id} item={it} />
          ))}
        </ul>
      )}

      {!expanded && remaining > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full mt-2 py-2 text-xs text-navy-700 hover:bg-gray-50 rounded"
        >
          더 보기 (+{remaining})
        </button>
      )}
      {expanded && items.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="w-full mt-2 py-2 text-xs text-gray-500 hover:bg-gray-50 rounded"
        >
          접기
        </button>
      )}
    </section>
  );
}

function ActionRow({ item }) {
  const style = LEVEL_STYLE[item.level] || LEVEL_STYLE.review;
  return (
    <li>
      <Link
        to={item.href}
        className="flex items-center gap-2 py-2.5 -mx-1 px-1 rounded hover:bg-gray-50 transition"
      >
        {/* 우선순위 태그 — 너비 고정해서 본문 정렬 일관 */}
        <span
          className={`text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded border ${style.tagBg} ${style.tagText} ${style.tagBorder} text-center shrink-0`}
          style={{ minWidth: 56 }}
        >
          {item.dayLabel}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-navy-800 truncate">{item.title}</div>
          {item.meta && (
            <div className="text-[11px] text-gray-500 truncate inline-flex items-center gap-1 mt-0.5">
              <KindIcon kind={item.kind} className="w-3.5 h-3.5 text-gray-400" />
              <span>{item.meta}</span>
            </div>
          )}
        </div>
        <span className="text-gray-300 shrink-0">›</span>
      </Link>
    </li>
  );
}
