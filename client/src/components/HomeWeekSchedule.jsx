import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { toDateKey, addDays, projectClass, projectBorderClass } from '../utils/date';
import { getHoliday } from '../utils/holidays';

// 오늘이 포함된 월요일 0시 반환
function getMonday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = day === 0 ? -6 : 1 - day; // 일요일이면 6일 전 월요일
  return addDays(d, diff);
}

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export default function HomeWeekSchedule() {
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const rangeStart = days[0];
  const rangeEnd = days[6];
  const startKey = toDateKey(rangeStart);
  const endKey = toDateKey(rangeEnd);

  const { data, isLoading } = useQuery({
    queryKey: ['schedules', 'all', startKey, endKey],
    queryFn: () => schedulesApi.listAll({ start: startKey, end: endKey }),
  });
  const entries = data?.entries || [];
  const loading = isLoading;

  const byDate = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const key = e.date.slice(0, 10);
      (map[key] = map[key] || []).push(e);
    });
    return map;
  }, [entries]);

  const todayKey = toDateKey(new Date());
  const thisMonday = toDateKey(getMonday(new Date()));
  const isThisWeek = toDateKey(weekStart) === thisMonday;

  return (
    <section className="bg-white border-y sm:border sm:rounded-xl p-2 sm:p-5 -mx-2 sm:mx-0">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-bold text-navy-800">이번주 일정</h2>
          <div className="flex items-center gap-2 text-xs sm:text-[10px] text-gray-600">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-sky-300"></span>현장</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-300"></span>견적</span>
          </div>
          {loading && <span className="text-xs text-gray-400">로딩 중...</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="px-2.5 py-1 border rounded hover:bg-gray-50 text-sm"
            title="지난주"
          >‹</button>
          <div className="text-sm font-medium text-navy-700 min-w-[140px] text-center">
            {formatRange(rangeStart, rangeEnd)}
          </div>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="px-2.5 py-1 border rounded hover:bg-gray-50 text-sm"
            title="다음주"
          >›</button>
          {!isThisWeek && (
            <button
              onClick={() => setWeekStart(getMonday(new Date()))}
              className="text-xs px-2 py-1 text-navy-700 hover:bg-navy-50 rounded"
            >오늘</button>
          )}
          <Link
            to="/schedule"
            className="ml-2 text-xs px-2.5 py-1 border border-navy-200 text-navy-700 rounded hover:bg-navy-50"
          >전체 일정 →</Link>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((d, i) => {
          const key = toDateKey(d);
          const dayEntries = byDate[key] || [];
          const isToday = key === todayKey;
          const isSat = i === 5;
          const isSun = i === 6;
          const holiday = getHoliday(d);
          const isRed = isSun || !!holiday;

          return (
            <div
              key={key}
              className={`border rounded-md sm:rounded-lg min-h-[90px] sm:min-h-28 flex flex-col overflow-hidden ${
                isToday ? 'border-navy-500 bg-navy-50/40' : 'border-gray-200 bg-white'
              }`}
            >
              {/* 모바일: 요일→날짜 위→아래 스택. 데스크톱: 가로 분리 유지 */}
              <div className={`px-1 py-0.5 sm:px-2 sm:py-1.5 text-[10px] sm:text-sm font-semibold border-b flex flex-col items-center sm:flex-row sm:items-center sm:justify-between leading-tight ${
                isRed ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-700'
              }`}>
                <span className="text-[9px] sm:text-sm text-gray-400 sm:text-inherit font-normal sm:font-semibold">{DAY_LABELS[i]}</span>
                <span className={`text-[12px] sm:text-sm font-bold sm:font-semibold ${isToday ? 'bg-navy-700 text-white rounded-full px-1.5 sm:px-1.5' : ''}`}>
                  {d.getDate()}
                </span>
              </div>
              {holiday && (
                <div className="px-1 py-0.5 text-[9px] sm:text-[10px] text-red-500/80 border-b text-center truncate" title={holiday}>{holiday}</div>
              )}
              <div className="px-0.5 py-0.5 sm:p-1 flex flex-col gap-px sm:gap-1 flex-1 overflow-hidden [&>a:nth-child(n+4)]:hidden sm:[&>a:nth-child(n+5)]:hidden">
                {dayEntries.length === 0 ? (
                  <div className="flex-1" />
                ) : (
                  dayEntries.map((e) => {
                    const projColor = projectClass(e.project?.id);
                    const projBorder = projectBorderClass(e.project?.id);
                    return (
                      <Link
                        key={e.id}
                        to={`/projects/${e.project?.id}/schedule`}
                        className={`
                          relative text-[10px] sm:text-xs rounded-sm sm:rounded leading-tight
                          pl-0.5 pr-0.5 py-0 sm:px-1.5 sm:py-0.5 truncate block
                          ${projColor}
                          border-l-0 sm:border-l-[3px] ${projBorder}
                          hover:brightness-95
                          ${e.confirmed ? '' : 'opacity-[0.55]'}
                        `}
                        title={`${e.project?.name || ''} · ${e.category ? `[${e.category}] ` : ''}${e.content}`}
                      >
                        <span className="truncate">{e.content}</span>
                        {e.confirmed && (
                          <span
                            aria-label="확정됨"
                            className="absolute top-1/2 -translate-y-1/2 right-[1px] w-[15px] h-[15px] sm:w-[18px] sm:h-[18px] rounded-full bg-emerald-500 text-white inline-flex items-center justify-center pointer-events-none z-[2]"
                            style={{ boxShadow: '0 0 0 1.5px #fff, 0 1px 3px rgba(0,0,0,0.2)' }}
                          >
                            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-[9px] h-[9px] sm:w-[11px] sm:h-[11px]"><path d="M3 6.5L5 8.5L9 4"/></svg>
                          </span>
                        )}
                      </Link>
                    );
                  })
                )}
                {dayEntries.length > 3 && (
                  <span className="sm:hidden text-[11px] sm:text-[9px] text-gray-400 text-center leading-none">
                    +{dayEntries.length - 3}
                  </span>
                )}
                {dayEntries.length > 4 && (
                  <Link
                    to="/schedule"
                    className="hidden sm:block text-xs sm:text-[10px] text-gray-500 text-center hover:text-navy-700"
                  >
                    +{dayEntries.length - 4}건 더
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatRange(start, end) {
  const s = `${start.getMonth() + 1}/${start.getDate()}`;
  const e = `${end.getMonth() + 1}/${end.getDate()}`;
  return `${s} – ${e}`;
}
