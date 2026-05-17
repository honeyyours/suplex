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
      <div className="flex items-center mb-3 gap-2 px-2 sm:px-0">
        {/* 좌측 spacer — 라벨이 시각 중앙에 오도록 */}
        <div className="flex-1" />
        {/* 중앙: 화살표 + 라벨 + 화살표 (라벨 옆에 가깝게, 테두리 X) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrent(addMonths(current, -1))}
            className="text-navy-700 hover:text-navy-900 text-base sm:text-lg leading-none px-1 py-0.5"
            aria-label="이전 달"
          >‹</button>
          <div className="font-semibold text-base sm:text-lg text-navy-800 whitespace-nowrap">
            {formatMonthLabel(current)}
          </div>
          <button
            onClick={() => setCurrent(addMonths(current, 1))}
            className="text-navy-700 hover:text-navy-900 text-base sm:text-lg leading-none px-1 py-0.5"
            aria-label="다음 달"
          >›</button>
          {loading && <span className="text-xs text-gray-400 ml-1">불러오는 중...</span>}
        </div>
        {/* 우측: 액션 */}
        <div className="flex-1 flex justify-end">
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
                          ${e.confirmed ? '' : 'opacity-[0.55]'}
                        `}
                        title={`${e.project?.name || ''} · ${e.category ? `[${e.category}] ` : ''}${e.content}`}
                      >
                        <PhaseInlineContent entry={e} textOnly textClassName="flex-1" />
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
