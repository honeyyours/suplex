// 홈 모바일 최상단 — 이번주 일정 위젯 (캘린더태스크 위젯 패턴)
// 2026-05-17 신설. 봉기님 요청: 모바일에서 최상단에 위젯스러운 한눈에 요약.
// 데스크톱은 기존 HomeWeekSchedule(큰 캘린더) 유지.
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { toDateKey, addDays, projectClass } from '../utils/date';
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

  return (
    <Link
      to="/schedule"
      className="sm:hidden block bg-white border border-gray-200 rounded-xl px-3 py-3 -mx-2 active:bg-gray-50 transition"
      aria-label="이번주 일정 — 전체 일정으로"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-navy-800">이번주 일정</span>
        <span className="text-[10px] text-gray-400">전체 일정 →</span>
      </div>
      <div className="grid grid-cols-7 gap-1">
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

          return (
            <div key={key} className="flex flex-col items-center gap-0.5 min-w-0">
              <span className={`text-[9px] font-medium ${dayColor}`}>{DAY_LABELS[i]}</span>
              <span
                className={`text-[13px] font-semibold tabular-nums leading-none px-1 py-0.5 rounded-full ${
                  isToday
                    ? 'bg-navy-700 text-white'
                    : dayColor
                }`}
              >
                {d.getDate()}
              </span>
              {holiday && (
                <span className="text-[8px] text-red-500/70 leading-none truncate max-w-full" title={holiday}>
                  {holiday.replace(' 연휴', '').replace(' 대체', '')}
                </span>
              )}
              {dayEntries.length === 0 ? (
                <div className="h-1.5" />
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-px max-w-full">
                  {dayEntries.slice(0, 4).map((e) => (
                    <span
                      key={e.id}
                      className={`w-1.5 h-1.5 rounded-full ${projectClass(e.project?.id)?.split(' ')[0] || 'bg-gray-400'} ${e.confirmed ? '' : 'opacity-40'}`}
                    />
                  ))}
                  {dayEntries.length > 4 && (
                    <span className="text-[8px] text-gray-500 leading-none">+{dayEntries.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Link>
  );
}
