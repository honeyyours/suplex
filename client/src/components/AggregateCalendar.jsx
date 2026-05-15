import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import {
  toDateKey, calendarGrid, addMonths, formatMonthLabel, projectClass, projectBorderClass,
} from '../utils/date';
import PhaseInlineContent from './PhaseInlineContent';

export default function AggregateCalendar({ status, projectIds, emptyText, headerRight } = {}) {
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const grid = useMemo(
    () => calendarGrid(current.getFullYear(), current.getMonth()),
    [current]
  );
  const rangeStart = grid[0];
  const rangeEnd = grid[grid.length - 1];
  const startKey = toDateKey(rangeStart);
  const endKey = toDateKey(rangeEnd);

  const projectIdsKey = projectIds ? projectIds.join(',') : '';
  const skip = projectIds && projectIds.length === 0;

  const { data, isLoading } = useQuery({
    queryKey: ['schedules', 'all', startKey, endKey, status || null, projectIdsKey],
    queryFn: () => schedulesApi.listAll({
      start: startKey,
      end: endKey,
      status,
      projectIds,
    }),
    enabled: !skip,
  });
  const entries = skip ? [] : (data?.entries || []);
  const loading = !skip && isLoading;

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
      <div className="grid grid-cols-3 items-center mb-3 gap-2 px-2 sm:px-0">
        <div className="justify-self-start">
          <button
            onClick={() => setCurrent(addMonths(current, -1))}
            className="px-3 py-1 border rounded hover:bg-gray-50"
            aria-label="이전 달"
          >‹</button>
        </div>
        <div className="text-center font-semibold text-base sm:text-lg text-navy-800 truncate">
          {formatMonthLabel(current)}
          {loading && <span className="text-xs text-gray-400 ml-1">불러오는 중...</span>}
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          <button
            onClick={() => setCurrent(addMonths(current, 1))}
            className="px-3 py-1 border rounded hover:bg-gray-50"
            aria-label="다음 달"
          >›</button>
          {headerRight}
        </div>
      </div>

      <div className="border-y sm:border sm:rounded-lg overflow-hidden bg-white">
        <div className="grid grid-cols-7 text-[11px] sm:text-xs font-semibold bg-gray-50 border-b">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div
              key={d}
              className={`px-1 sm:px-2 py-1.5 sm:py-2 text-center ${
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
            const isFirstOfMonth = date.getDate() === 1;

            return (
              <div
                key={key}
                className={`border-r border-b last:border-r-0 min-h-[75px] sm:min-h-[100px] flex flex-col overflow-hidden ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50/50 dark:bg-slate-900/30'
                }`}
              >
                <div className={`px-1 py-0.5 sm:px-2 sm:py-1.5 text-[10px] sm:text-sm flex-shrink-0 ${
                  dayOfWeek === 0 ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}>
                  <span className={`${isToday ? 'bg-navy-700 text-white rounded-full px-1 sm:px-1.5' : ''} ${isFirstOfMonth && !isToday ? 'font-semibold text-navy-700' : ''}`}>
                    {isFirstOfMonth ? `${date.getMonth() + 1}/1` : date.getDate()}
                  </span>
                </div>
                <div className="px-0.5 sm:px-1 pb-0.5 sm:pb-1 flex flex-col gap-0.5 flex-1 overflow-hidden [&>a:nth-child(n+4)]:hidden sm:[&>a:nth-child(n+4)]:flex">
                  {dayEntries.map((e) => {
                    const projColor = projectClass(e.project?.id);
                    const projBorder = projectBorderClass(e.project?.id);
                    return (
                      <Link
                        key={e.id}
                        to={`/projects/${e.project?.id}/schedule`}
                        className={`
                          relative text-[10px] sm:text-sm rounded-sm sm:rounded leading-tight
                          pl-0.5 pr-0.5 py-0 sm:px-1.5 sm:py-0.5 truncate flex items-center gap-1
                          ${projColor}
                          border-l-0 sm:border-l-[3px] ${projBorder}
                          hover:brightness-95
                        `}
                        title={`${e.project?.name || ''} · ${e.category ? `[${e.category}] ` : ''}${e.content}`}
                      >
                        <PhaseInlineContent entry={e} textOnly textClassName="flex-1" />
                        {e.confirmed && (
                          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold pointer-events-none drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]">✓</span>
                        )}
                      </Link>
                    );
                  })}
                  {dayEntries.length > 3 && (
                    <span className="sm:hidden text-[11px] sm:text-[9px] text-gray-400 text-center leading-none mt-0.5">
                      +{dayEntries.length - 3}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
