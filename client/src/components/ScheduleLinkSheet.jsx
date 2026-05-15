// 체크리스트 항목을 공정 일정에 연결할 때 일정을 고르는 모달.
// 일정 달력 형태 — 월별 7×N 그리드 안에 일정 막대 표시.
// 일정 막대 클릭 → onSelect(entry).
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import {
  toDateKey, calendarGrid, addMonths, formatMonthLabel,
  categoryClass, categoryBorderClass,
} from '../utils/date';
import { useEscape } from '../hooks/useEscape';

export default function ScheduleLinkSheet({ projectId, onSelect, onClose }) {
  useEscape(onClose);

  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const grid = useMemo(
    () => calendarGrid(current.getFullYear(), current.getMonth()),
    [current],
  );
  const startKey = toDateKey(grid[0]);
  const endKey = toDateKey(grid[grid.length - 1]);

  const { data, isLoading } = useQuery({
    queryKey: ['schedules', 'list', projectId, startKey, endKey],
    queryFn: () => schedulesApi.list(projectId, { start: startKey, end: endKey }),
    enabled: !!projectId,
  });
  const entries = data?.entries || [];

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
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl sm:rounded-xl rounded-t-2xl overflow-hidden max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 py-3 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <h3 className="font-semibold text-navy-800 dark:text-navy-200">📌 공정 일정 선택</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl leading-none"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 월 네비 */}
        <div className="flex items-center justify-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
          <button
            onClick={() => setCurrent(addMonths(current, -1))}
            className="text-navy-700 hover:text-navy-900 text-lg leading-none px-2 py-0.5"
            aria-label="이전 달"
          >‹</button>
          <div className="font-semibold text-base sm:text-lg text-navy-800 dark:text-navy-200 whitespace-nowrap min-w-[80px] text-center">
            {formatMonthLabel(current)}
          </div>
          <button
            onClick={() => setCurrent(addMonths(current, 1))}
            className="text-navy-700 hover:text-navy-900 text-lg leading-none px-2 py-0.5"
            aria-label="다음 달"
          >›</button>
          {isLoading && <span className="text-xs text-gray-400 ml-2">불러오는 중...</span>}
        </div>

        {/* 캘린더 */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3">
          <div className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 text-[10px] sm:text-xs font-semibold bg-gray-50 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-800">
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div
                  key={d}
                  className={`text-center py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  {d}
                </div>
              ))}
            </div>
            {/* 날짜 셀 */}
            <div className="grid grid-cols-7">
              {grid.map((date) => {
                const key = toDateKey(date);
                const dayEntries = byDate[key] || [];
                const isCurrentMonth = date.getMonth() === current.getMonth();
                const isToday = key === todayKey;
                const dow = date.getDay();
                return (
                  <div
                    key={key}
                    className={`border-r border-b last:border-r-0 border-gray-100 dark:border-slate-800 min-h-[60px] sm:min-h-[80px] flex flex-col overflow-hidden ${
                      isCurrentMonth ? 'bg-white dark:bg-slate-900' : 'bg-gray-50/50 dark:bg-slate-900/30'
                    }`}
                  >
                    <div className={`px-1 py-0.5 text-[10px] sm:text-xs flex-shrink-0 ${
                      !isCurrentMonth ? 'text-gray-300 dark:text-gray-600' :
                      dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      <span className={isToday ? 'bg-navy-700 text-white rounded-full px-1' : ''}>
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="px-0.5 pb-0.5 flex flex-col gap-0.5 flex-1 overflow-hidden">
                      {dayEntries.slice(0, 3).map((e) => {
                        const catColor = categoryClass(e.category);
                        const borderColor = categoryBorderClass(e.category);
                        return (
                          <button
                            key={e.id}
                            onClick={() => onSelect(e)}
                            className={`
                              text-left text-[10px] leading-tight rounded-sm pl-0.5 pr-0.5 py-0
                              truncate ${catColor}
                              border-l-0 sm:border-l-[3px] ${borderColor}
                              hover:brightness-95
                            `}
                            title={`${e.category ? `[${e.category}] ` : ''}${e.content}`}
                          >
                            {e.content}
                          </button>
                        );
                      })}
                      {dayEntries.length > 3 && (
                        <span className="text-[10px] text-gray-400 text-center leading-none">
                          +{dayEntries.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {!isLoading && entries.length === 0 && (
            <div className="text-center text-xs text-gray-400 py-4">
              이번 달에 등록된 일정이 없습니다.
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-800 text-[11px] text-gray-500 dark:text-gray-400 text-center flex-shrink-0">
          일정 막대를 눌러 선택하세요
        </div>
      </div>
    </div>
  );
}
