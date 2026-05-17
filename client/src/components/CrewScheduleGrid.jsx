import { useEffect, useMemo, useState } from 'react';
import { crewApi } from '../api/vendors';
import { useEscape } from '../hooks/useEscape';

// 시공팀 통합 일정 — 월간 그리드 (회사 ScheduleCalendar와 동일 시각 패턴, 읽기 전용·다중 회사).
// 회사별 색상 자동 할당(회사 ID 해시). 셀 클릭 시 그날 일정 모달.
// 더블 부킹 셀에 ⚠️ 표시. 월 네비게이션(이전·이번 달·다음).

const COMPANY_PALETTE = [
  { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-300', dot: 'bg-sky-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300', dot: 'bg-violet-500' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300', dot: 'bg-cyan-500' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300', dot: 'bg-pink-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300', dot: 'bg-indigo-500' },
];
function pickPalette(companyId) {
  if (!companyId) return COMPANY_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < companyId.length; i++) hash = (hash * 31 + companyId.charCodeAt(i)) >>> 0;
  return COMPANY_PALETTE[hash % COMPANY_PALETTE.length];
}

function fmtYmd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function startOfMonthGrid(d) {
  // 월 1일이 속한 주의 일요일부터 시작
  const s = startOfMonth(d);
  s.setDate(s.getDate() - s.getDay());
  return s;
}
function endOfMonthGrid(d) {
  // 월 말일이 속한 주의 토요일까지
  const e = endOfMonth(d);
  e.setDate(e.getDate() + (6 - e.getDay()));
  return e;
}
function buildGrid(monthDate) {
  const start = startOfMonthGrid(monthDate);
  const end = endOfMonthGrid(monthDate);
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export default function CrewScheduleGrid() {
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDateKey, setActiveDateKey] = useState(null);

  const grid = useMemo(() => buildGrid(monthDate), [monthDate]);
  const from = fmtYmd(grid[0]);
  const to = fmtYmd(grid[grid.length - 1]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    crewApi.schedules(from, to)
      .then((data) => { if (alive) { setSchedules(data.schedules || []); setLoading(false); } })
      .catch(() => { if (alive) { setSchedules([]); setLoading(false); } });
    return () => { alive = false; };
  }, [from, to]);

  const byDate = useMemo(() => {
    const map = new Map();
    for (const s of schedules) {
      const key = fmtYmd(new Date(s.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return map;
  }, [schedules]);

  const monthLabel = `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`;
  const today = fmtYmd(new Date());

  function shiftMonth(delta) {
    setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + delta, 1));
  }
  function goToday() {
    setMonthDate(startOfMonth(new Date()));
  }

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg shadow-sm dark:ring-1 dark:ring-white/5">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 border-b dark:border-slate-700">
        <div className="text-sm font-semibold">📅 {monthLabel}</div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => shiftMonth(-1)}
            className="text-sm px-2 py-1 border rounded hover:bg-gray-50 dark:hover:bg-slate-800"
            aria-label="이전 달"
          >‹</button>
          <button
            onClick={goToday}
            className="text-xs px-2 py-1 border rounded hover:bg-gray-50 dark:hover:bg-slate-800"
          >오늘</button>
          <button
            onClick={() => shiftMonth(1)}
            className="text-sm px-2 py-1 border rounded hover:bg-gray-50 dark:hover:bg-slate-800"
            aria-label="다음 달"
          >›</button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-xs font-semibold bg-gray-50 dark:bg-slate-800/60 border-b dark:border-slate-700">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div
            key={d}
            className={`px-1 py-1.5 text-center ${
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
            }`}
          >{d}</div>
        ))}
      </div>

      {/* 그리드 */}
      {loading ? (
        <div className="p-8 text-center text-gray-400 text-sm">불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-7">
          {grid.map((d) => {
            const key = fmtYmd(d);
            const list = byDate.get(key) || [];
            const inMonth = d.getMonth() === monthDate.getMonth();
            const dow = d.getDay();
            const isToday = key === today;
            const companyIds = new Set(list.map((s) => s.company?.id).filter(Boolean));
            const isDoubleBooking = companyIds.size >= 2;

            return (
              <button
                key={key}
                onClick={() => list.length > 0 && setActiveDateKey(key)}
                className={`min-h-[80px] sm:min-h-[100px] border-b border-r dark:border-slate-700 p-1 text-left flex flex-col gap-0.5 ${
                  inMonth ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-900/40'
                } ${list.length === 0 ? 'cursor-default' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800'}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs ${
                    !inMonth ? 'text-gray-300 dark:text-gray-600' :
                    dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'
                  } ${isToday ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-navy-700 text-white font-bold' : ''}`}>
                    {d.getDate()}
                  </span>
                  {isDoubleBooking && <span className="text-[10px]" title={`회사 ${companyIds.size}곳`}>⚠️</span>}
                </div>
                <div className="flex flex-col gap-0.5 overflow-hidden">
                  {list.slice(0, 3).map((s) => {
                    const palette = pickPalette(s.company?.id);
                    return (
                      <div
                        key={s.id}
                        className={`text-[10px] leading-tight rounded px-1 py-0.5 truncate ${palette.bg} ${palette.text} border ${palette.border}`}
                      >
                        {s.content || s.category || '-'}
                      </div>
                    );
                  })}
                  {list.length > 3 && (
                    <span className="text-[10px] text-gray-500 px-1">+{list.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {activeDateKey && (
        <DayDetailModal
          dateKey={activeDateKey}
          entries={byDate.get(activeDateKey) || []}
          onClose={() => setActiveDateKey(null)}
        />
      )}
    </section>
  );
}

function DayDetailModal({ dateKey, entries, onClose }) {
  useEscape(true, onClose);
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dateLabel = `${m}월 ${d}일 (${days[date.getDay()]})`;
  const companyIds = new Set(entries.map((e) => e.company?.id).filter(Boolean));
  const isDoubleBooking = companyIds.size >= 2;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-t-xl sm:rounded-xl shadow-xl dark:ring-1 dark:ring-white/5 w-full sm:max-w-md max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 px-5 py-4 border-b dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-navy-800 dark:text-navy-200">{dateLabel}</div>
            {isDoubleBooking && (
              <div className="text-xs text-rose-700 mt-0.5">⚠️ 같은 날 회사 {companyIds.size}곳</div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <ul className="p-4 space-y-2">
          {entries.map((s) => {
            const palette = pickPalette(s.company?.id);
            return (
              <li key={s.id} className={`p-3 rounded border ${palette.bg} ${palette.border}`}>
                <div className="flex items-center gap-1.5 flex-wrap text-xs mb-1">
                  <span className={`w-2 h-2 rounded-full ${palette.dot}`} />
                  <span className={`font-semibold ${palette.text}`}>{s.company?.name || '회사 미상'}</span>
                  {s.project?.name && (
                    <span className="text-gray-600 dark:text-gray-400">· {s.project.name}</span>
                  )}
                  {s.vendor?.category && (
                    <span className="text-gray-500">· {s.vendor.category}</span>
                  )}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
                  {s.content}
                </div>
                {s.project?.address && (
                  <div className="text-xs text-gray-500 mt-1">{s.project.address}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
