import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { schedulesApi } from '../api/schedules';
import {
  toDateKey, calendarGrid, addMonths, formatMonthLabel, categoryClass,
} from '../utils/date';

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

export default function AggregateCalendar({ status, projectIds, emptyText } = {}) {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const grid = useMemo(
    () => calendarGrid(current.getFullYear(), current.getMonth()),
    [current]
  );
  const rangeStart = grid[0];
  const rangeEnd = grid[grid.length - 1];

  const projectIdsKey = projectIds ? projectIds.join(',') : '';

  useEffect(() => {
    // projectIds가 빈 배열이면 결과는 어차피 0건이므로 호출 스킵
    if (projectIds && projectIds.length === 0) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    schedulesApi
      .listAll({
        start: toDateKey(rangeStart),
        end: toDateKey(rangeEnd),
        status,
        projectIds,
      })
      .then((r) => setEntries(r.entries || []))
      .finally(() => setLoading(false));
  }, [current, status, projectIdsKey]); // eslint-disable-line

  // 프로젝트별 색상 매핑 (일관된 순서)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrent(addMonths(current, -1))}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >‹</button>
          <div className="font-semibold text-lg text-navy-800 min-w-24 text-center">
            {formatMonthLabel(current)}
          </div>
          <button
            onClick={() => setCurrent(addMonths(current, 1))}
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >›</button>
          <button
            onClick={() => setCurrent(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
            className="ml-2 text-xs px-2 py-1 text-navy-700 hover:bg-navy-50 rounded"
          >오늘</button>
        </div>
        {loading && <span className="text-xs text-gray-400">불러오는 중...</span>}
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-7 text-xs font-semibold bg-gray-50 border-b">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div
              key={d}
              className={`px-2 py-2 text-center ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
              }`}
            >{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((date) => {
            const key = toDateKey(date);
            const dayEntries = byDate[key] || [];
            const isCurrentMonth = date.getMonth() === current.getMonth();
            const isToday = key === todayKey;
            const dayOfWeek = date.getDay();

            return (
              <div
                key={key}
                className={`border-r border-b last:border-r-0 min-h-28 flex flex-col ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                <div className={`px-1.5 py-1 text-xs ${
                  dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}>
                  <span className={`${isToday ? 'bg-navy-700 text-white rounded-full px-1.5' : ''}`}>
                    {date.getDate()}
                  </span>
                </div>
                <div className="px-1 pb-1 flex flex-col gap-0.5 flex-1">
                  {dayEntries.map((e) => (
                    <Link
                      key={e.id}
                      to={`/projects/${e.project?.id}/schedule`}
                      className={`text-[11px] rounded px-1.5 py-0.5 truncate border-l-2 flex items-center gap-1 ${
                        e.confirmed ? 'border-emerald-500' : 'border-navy-400'
                      } hover:brightness-95`}
                    >
                      {e.project?.name && (
                        <span className={`text-[10px] px-1 py-0.5 rounded ${
                          projectColor[e.project.id] || 'bg-gray-100 text-gray-700'
                        }`}>
                          {e.project.name}
                        </span>
                      )}
                      {e.category && (
                        <span className={`text-[10px] px-1 py-0.5 rounded ${categoryClass(e.category)}`}>
                          {e.category}
                        </span>
                      )}
                      <span className="truncate text-navy-800">{e.content}</span>
                      {e.confirmed && <span className="text-emerald-500 flex-shrink-0">✓</span>}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
