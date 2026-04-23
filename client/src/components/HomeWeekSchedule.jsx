import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { schedulesApi } from '../api/schedules';
import { toDateKey, addDays, categoryClass } from '../utils/date';

const STATUS_COLORS = {
  IN_PROGRESS: 'bg-sky-100 text-sky-800',
  PLANNED: 'bg-amber-100 text-amber-800',
};
const DEFAULT_COLOR = 'bg-gray-100 text-gray-700';

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
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const rangeStart = days[0];
  const rangeEnd = days[6];

  useEffect(() => {
    setLoading(true);
    schedulesApi
      .listAll({ start: toDateKey(rangeStart), end: toDateKey(rangeEnd) })
      .then((r) => setEntries(r.entries || []))
      .finally(() => setLoading(false));
  }, [weekStart]); // eslint-disable-line

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
          <div className="flex items-center gap-2 text-[10px] text-gray-600">
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
            {isThisWeek && <span className="ml-1 text-[10px] bg-navy-700 text-white px-1.5 py-0.5 rounded">이번주</span>}
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

          return (
            <div
              key={key}
              className={`border rounded-md sm:rounded-lg min-h-[80px] sm:min-h-[120px] flex flex-col overflow-hidden ${
                isToday ? 'border-navy-500 bg-navy-50/40' : 'border-gray-200 bg-white'
              }`}
            >
              <div className={`px-1 py-0.5 sm:px-2 sm:py-1.5 text-[10px] sm:text-xs font-semibold border-b flex items-center justify-between ${
                isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-700'
              }`}>
                <span>{DAY_LABELS[i]}</span>
                <span className={isToday ? 'bg-navy-700 text-white rounded-full px-1 sm:px-1.5' : ''}>
                  {d.getDate()}
                </span>
              </div>
              <div className="px-0.5 py-0.5 sm:p-1 flex flex-col gap-px sm:gap-1 flex-1 overflow-hidden [&>a:nth-child(n+4)]:hidden sm:[&>a:nth-child(n+5)]:hidden">
                {dayEntries.length === 0 ? (
                  <div className="text-[10px] text-gray-300 text-center py-1 sm:py-2">—</div>
                ) : (
                  dayEntries.map((e) => {
                    const projColor = STATUS_COLORS[e.project?.status] || DEFAULT_COLOR;
                    return (
                      <Link
                        key={e.id}
                        to={`/projects/${e.project?.id}/schedule`}
                        className={`
                          relative text-[9px] sm:text-[11px] rounded-sm sm:rounded pl-0.5 pr-0 sm:px-1.5 py-0.5 sm:py-0.5 truncate block
                          ${projColor} sm:bg-gray-50 sm:text-navy-800
                          sm:border-l-2 ${e.confirmed ? 'sm:border-emerald-500 sm:bg-emerald-50/40' : 'sm:border-navy-400'}
                          hover:brightness-95
                        `}
                        title={`${e.project?.name || ''} · ${e.content}`}
                      >
                        {e.project?.name && (
                          <span className={`hidden sm:inline-block text-[10px] px-1 py-0.5 rounded mr-1 ${projColor}`}>
                            {e.project.name}
                          </span>
                        )}
                        {e.category && (
                          <span className={`hidden sm:inline-block text-[10px] px-1 py-0.5 rounded mr-1 ${categoryClass(e.category)}`}>
                            {e.category}
                          </span>
                        )}
                        <span className="truncate">{e.content}</span>
                        {e.confirmed && (
                          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-emerald-600 text-[10px] sm:text-xs font-bold pointer-events-none drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]">✓</span>
                        )}
                      </Link>
                    );
                  })
                )}
                {dayEntries.length > 3 && (
                  <span className="sm:hidden text-[9px] text-gray-400 text-center leading-none">
                    +{dayEntries.length - 3}
                  </span>
                )}
                {dayEntries.length > 4 && (
                  <Link
                    to="/schedule"
                    className="hidden sm:block text-[10px] text-gray-500 text-center hover:text-navy-700"
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
