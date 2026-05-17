import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { toDateKey, addDays, projectClass, projectBorderClass } from '../utils/date';
import { buildLaneInfo, assignSlots } from '../utils/calendarLane';
import { getHoliday } from '../utils/holidays';

// 오늘이 포함된 일요일 0시 반환 — 다른 캘린더(일~토)와 동일한 주 기준
function getSunday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return addDays(d, -d.getDay());
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function HomeWeekSchedule() {
  const [weekStart, setWeekStart] = useState(() => getSunday(new Date()));

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

  // Lane 사전 계산 — 같은 프로젝트는 같은 행
  const laneInfo = useMemo(() => buildLaneInfo(days, byDate), [days, byDate]);

  // 하단 현장 인덱스 — 이번 주에 일정이 있는 프로젝트만
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
  const thisSunday = toDateKey(getSunday(new Date()));
  const isThisWeek = toDateKey(weekStart) === thisSunday;

  return (
    <section className="bg-white border-y sm:border sm:rounded-xl p-2 sm:p-5 -mx-2 sm:mx-0 select-none sm:select-auto">
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
              onClick={() => setWeekStart(getSunday(new Date()))}
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
          const isSun = i === 0;
          const isSat = i === 6;
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
              {/* 모바일 — 빽빽 모드 */}
              <div className="sm:hidden px-0.5 py-0.5 flex flex-col gap-px flex-1 overflow-hidden [&>a:nth-child(n+4)]:hidden">
                {dayEntries.length === 0 ? (
                  <div className="flex-1" />
                ) : (
                  dayEntries.map((e) => <WeekEntryBar key={e.id} entry={e} />)
                )}
                {dayEntries.length > 3 && (
                  <span className="text-[11px] text-gray-400 text-center leading-none">
                    +{dayEntries.length - 3}
                  </span>
                )}
              </div>

              {/* 데스크톱 — lane 모드: 같은 프로젝트는 같은 행 */}
              <div className="hidden sm:flex sm:flex-col p-1 gap-1 flex-1 overflow-hidden">
                {(() => {
                  const slots = assignSlots(laneInfo, dayEntries);
                  if (slots.length === 0) return <div className="flex-1" />;
                  return slots.map((e, i) =>
                    e ? <WeekEntryBar key={e.id} entry={e} /> : <WeekEmptySlot key={`empty-${i}`} />
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>

      {legendItems.length > 1 && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-xs sm:text-sm text-gray-500 mr-0.5">현장</span>
          {legendItems.map(({ id, name, projColor, projBorder }) => (
            <Link
              key={id}
              to={`/projects/${id}/schedule`}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 hover:text-navy-800"
              title={name}
            >
              <span
                className={`inline-block w-3.5 h-3.5 rounded-sm ${projColor} border-l-[3px] ${projBorder}`}
                aria-hidden="true"
              />
              <span className="truncate max-w-[140px]">{name}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function WeekEntryBar({ entry: e }) {
  const projColor = projectClass(e.project?.id);
  const projBorder = projectBorderClass(e.project?.id);
  return (
    <Link
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
}

function WeekEmptySlot() {
  return (
    <div className="text-xs leading-tight px-1.5 py-0.5 invisible" aria-hidden="true">
      &nbsp;
    </div>
  );
}

function formatRange(start, end) {
  const s = `${start.getMonth() + 1}/${start.getDate()}`;
  const e = `${end.getMonth() + 1}/${end.getDate()}`;
  return `${s} – ${e}`;
}
