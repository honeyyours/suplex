import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import {
  toDateKey, calendarGrid, addMonths, formatMonthLabel, projectClass, projectBorderClass,
} from '../utils/date';
import { buildLaneInfo, assignSlots } from '../utils/calendarLane';
import { getHoliday } from '../utils/holidays';
import { openSchedulePrint } from '../utils/schedulePrint';
import { useAuth } from '../contexts/AuthContext';
import PhaseInlineContent from './PhaseInlineContent';

export default function AggregateCalendar({ status, projectIds, emptyText, headerRight, printTitle } = {}) {
  const { auth } = useAuth();
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

  // 주 단위 chunk + 주별 lane 사전 계산 — 같은 프로젝트가 같은 행에 정렬되도록
  const weekLaneInfo = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));
    return weeks.map((week) => buildLaneInfo(week, byDate));
  }, [grid, byDate]);

  // 하단 현장 인덱스
  const legendItems = useMemo(() => {
    const map = new Map();
    for (const e of entries) {
      if (!e.project?.id) continue;
      if (!map.has(e.project.id)) {
        map.set(e.project.id, {
          id: e.project.id,
          name: e.project.name || '(이름 없음)',
          projColor: projectClass(e.project.id),
          projBorder: projectBorderClass(e.project.id),
        });
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
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
        <div className="flex-1 flex justify-end gap-2">
          {headerRight}
          <button
            onClick={() => openSchedulePrint({
              entries,
              start: startKey,
              end: endKey,
              title: printTitle || `${formatMonthLabel(current)} 일정`,
              companyName: auth?.company?.name || '',
            })}
            className="text-xs px-2 py-1 border rounded hover:bg-gray-50 whitespace-nowrap"
            title="A4 인쇄/PDF 저장 (새 창)"
          >
            📄 PDF 인쇄
          </button>
        </div>
      </div>

      <div className="border-y sm:border sm:rounded-lg overflow-hidden bg-white select-none sm:select-auto">
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
          {grid.map((date, idx) => {
            const key = toDateKey(date);
            const dayEntries = byDate[key] || [];
            const weekIdx = Math.floor(idx / 7);
            const slots = assignSlots(weekLaneInfo[weekIdx], dayEntries);
            const isCurrentMonth = date.getMonth() === current.getMonth();
            const isToday = key === todayKey;
            const dayOfWeek = date.getDay();
            const isFirstOfMonth = date.getDate() === 1;
            const holiday = getHoliday(date);
            const isRed = dayOfWeek === 0 || !!holiday;

            return (
              <div
                key={key}
                className={`border-r border-b last:border-r-0 min-h-[90px] sm:min-h-[100px] flex flex-col overflow-hidden ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50/50 dark:bg-slate-900/30'
                }`}
              >
                <div className={`px-1 py-0.5 sm:px-2 sm:py-1.5 text-[10px] sm:text-sm flex-shrink-0 flex items-baseline gap-1 ${
                  isRed ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}>
                  <span className={`${isToday ? 'bg-navy-700 text-white rounded-full px-1 sm:px-1.5' : ''} ${isFirstOfMonth && !isToday ? 'font-semibold text-navy-700' : ''}`}>
                    {isFirstOfMonth ? `${date.getMonth() + 1}/1` : date.getDate()}
                  </span>
                  {holiday && (
                    <span className="text-[9px] sm:text-[10px] text-red-500/80 truncate" title={holiday}>{holiday}</span>
                  )}
                </div>

                {/* lane 모드 — 같은 주에서 같은 프로젝트는 같은 행 (모바일·데스크톱 공통) */}
                <div className="flex flex-col px-0.5 pb-0.5 sm:px-1 sm:pb-1 gap-0.5 flex-1 overflow-hidden">
                  {slots.map((e, i) =>
                    e ? <EntryBar key={e.id} entry={e} /> : <EmptySlot key={`empty-${i}`} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {legendItems.length > 1 && (
        <div className="mt-2 sm:mt-3 px-2 sm:px-0 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mr-0.5">현장</span>
          {legendItems.map(({ id, name, projColor, projBorder }) => (
            <Link
              key={id}
              to={`/projects/${id}/schedule`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:text-navy-800 dark:hover:text-navy-200"
              title={name}
            >
              <span
                className={`inline-block w-3.5 h-3.5 rounded-sm ${projColor} border-l-[3px] ${projBorder}`}
                aria-hidden="true"
              />
              <span className="truncate max-w-[160px]">{name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 일정 막대 + 빈 슬롯 placeholder
// ============================================
function EntryBar({ entry: e }) {
  const projColor = projectClass(e.project?.id);
  const projBorder = projectBorderClass(e.project?.id);
  return (
    <Link
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
}

// 막대와 같은 padding·line-height로 invisible — 같은 행 정렬 유지 (모바일/데스크톱 막대 사이즈와 동일하게)
function EmptySlot() {
  return (
    <div className="text-[10px] sm:text-sm leading-tight pl-0.5 pr-0.5 py-0 sm:px-1.5 sm:py-0.5 invisible" aria-hidden="true">
      &nbsp;
    </div>
  );
}
