// 홈 모바일 이번주 위젯 — 둥근 카드 + 세로 스택 셀 + lane 모드(같은 현장 같은 줄)
// 2026-05-17: 점 → 텍스트 막대로 재설계. 사이즈 키워 일정 제목을 최대한 노출.
// 데스크톱은 별도 HomeWeekSchedule(큰 캘린더) 유지.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { toDateKey, addDays, projectClass, projectBorderClass } from '../utils/date';
import { buildLaneInfo, assignSlots } from '../utils/calendarLane';
import { getHoliday } from '../utils/holidays';

function getSunday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return addDays(d, -d.getDay());
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function HomeWeekWidget() {
  const weekStart = useMemo(() => getSunday(new Date()), []);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const startKey = toDateKey(days[0]);
  const endKey = toDateKey(days[6]);
  const todayKey = toDateKey(new Date());

  const { data } = useQuery({
    queryKey: ['schedules', 'all', startKey, endKey],
    queryFn: () => schedulesApi.listAll({ start: startKey, end: endKey }),
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

  const laneInfo = useMemo(() => buildLaneInfo(days, byDate), [days, byDate]);

  return (
    <section className="sm:hidden block bg-white border border-gray-200 rounded-xl px-2 py-3 -mx-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-bold text-navy-800">이번주 일정</span>
        <Link
          to="/schedule"
          className="text-[11px] text-gray-500 active:text-navy-700"
        >전체 일정 →</Link>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((d, i) => {
          const key = toDateKey(d);
          const dayEntries = byDate[key] || [];
          const isToday = key === todayKey;
          const isSun = i === 0;
          const isSat = i === 6;
          const holiday = getHoliday(d);
          const isRed = isSun || !!holiday;
          const dayColor = isRed
            ? 'text-red-500'
            : isSat
              ? 'text-blue-500'
              : 'text-gray-600';
          const slots = assignSlots(laneInfo, dayEntries);

          return (
            <div key={key} className="flex flex-col items-stretch min-w-0">
              <div className="flex flex-col items-center pb-1">
                <span className={`text-[9px] font-medium leading-none ${dayColor}`}>
                  {DAY_LABELS[i]}
                </span>
                <span
                  className={`text-[13px] font-semibold tabular-nums leading-none mt-1 px-1.5 py-0.5 rounded-full ${
                    isToday ? 'bg-navy-700 text-white' : dayColor
                  }`}
                >
                  {d.getDate()}
                </span>
                {holiday && (
                  <span
                    className="text-[8px] text-red-500/70 leading-none mt-0.5 truncate max-w-full"
                    title={holiday}
                  >
                    {holiday.replace(' 연휴', '').replace(' 대체', '')}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-px min-h-[140px]">
                {slots.length === 0 ? (
                  <div className="flex-1" />
                ) : (
                  slots.map((e, idx) =>
                    e
                      ? <WidgetEntryBar key={e.id} entry={e} />
                      : <WidgetEmptySlot key={`empty-${idx}`} />
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function WidgetEntryBar({ entry: e }) {
  const projColor = projectClass(e.project?.id);
  const projBorder = projectBorderClass(e.project?.id);
  return (
    <Link
      to={`/projects/${e.project?.id}/schedule`}
      className={`
        text-[9px] leading-tight px-1 py-[2px] rounded-sm truncate block
        ${projColor}
        border-l-2 ${projBorder}
        ${e.confirmed ? '' : 'opacity-[0.55]'}
      `}
      title={`${e.project?.name || ''} · ${e.category ? `[${e.category}] ` : ''}${e.content}`}
    >
      {e.content}
    </Link>
  );
}

function WidgetEmptySlot() {
  return (
    <div className="text-[9px] leading-tight px-1 py-[2px] invisible" aria-hidden="true">
      &nbsp;
    </div>
  );
}
