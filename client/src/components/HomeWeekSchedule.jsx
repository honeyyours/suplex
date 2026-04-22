import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { schedulesApi } from '../api/schedules';
import { toDateKey, addDays, categoryClass } from '../utils/date';

const PROJECT_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-pink-100 text-pink-800',
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-800',
  'bg-indigo-100 text-indigo-800',
  'bg-red-100 text-red-800',
  'bg-yellow-100 text-yellow-800',
  'bg-teal-100 text-teal-800',
];

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

  const projectColor = useMemo(() => {
    const map = {};
    let i = 0;
    entries.forEach((e) => {
      if (e.project?.id && !map[e.project.id]) {
        map[e.project.id] = PROJECT_COLORS[i % PROJECT_COLORS.length];
        i++;
      }
    });
    return map;
  }, [entries]);

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
    <section className="bg-white rounded-xl border p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-navy-800">이번주 일정</h2>
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

      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const key = toDateKey(d);
          const dayEntries = byDate[key] || [];
          const isToday = key === todayKey;
          const isSat = i === 5;
          const isSun = i === 6;

          return (
            <div
              key={key}
              className={`border rounded-lg min-h-[120px] flex flex-col ${
                isToday ? 'border-navy-500 bg-navy-50/40' : 'border-gray-200 bg-white'
              }`}
            >
              <div className={`px-2 py-1.5 text-xs font-semibold border-b flex items-center justify-between ${
                isSun ? 'text-red-500' : isSat ? 'text-blue-500' : 'text-gray-700'
              }`}>
                <span>{DAY_LABELS[i]}</span>
                <span className={isToday ? 'bg-navy-700 text-white rounded-full px-1.5' : ''}>
                  {d.getDate()}
                </span>
              </div>
              <div className="p-1 flex flex-col gap-1 flex-1">
                {dayEntries.length === 0 ? (
                  <div className="text-[10px] text-gray-300 text-center py-2">—</div>
                ) : (
                  dayEntries.slice(0, 4).map((e) => (
                    <Link
                      key={e.id}
                      to={`/projects/${e.project?.id}/schedule`}
                      className={`text-[11px] rounded px-1.5 py-0.5 border-l-2 truncate block ${
                        e.confirmed ? 'border-emerald-500 bg-emerald-50/40' : 'border-navy-400 bg-gray-50'
                      } hover:brightness-95`}
                      title={`${e.project?.name || ''} · ${e.content}`}
                    >
                      {e.project?.name && (
                        <span className={`text-[10px] px-1 py-0.5 rounded mr-1 ${
                          projectColor[e.project.id] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {e.project.name}
                        </span>
                      )}
                      {e.category && (
                        <span className={`text-[10px] px-1 py-0.5 rounded mr-1 ${categoryClass(e.category)}`}>
                          {e.category}
                        </span>
                      )}
                      <span className="text-navy-800">{e.content}</span>
                    </Link>
                  ))
                )}
                {dayEntries.length > 4 && (
                  <Link
                    to="/schedule"
                    className="text-[10px] text-gray-500 text-center hover:text-navy-700"
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
