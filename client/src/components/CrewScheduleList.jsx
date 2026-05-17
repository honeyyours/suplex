import { useEffect, useMemo, useState } from 'react';
import { crewApi } from '../api/vendors';

// 시공팀 통합 일정 리스트 — 이번 주 + 다음 주.
// 회사별 색상 자동 할당. 같은 날 회사 2개 이상이면 ⚠️ 더블 부킹 경고.
// 모바일 우선. 후속 Step: 월간 그리드, 1-탭 확정 응답.

const COMPANY_PALETTE = [
  { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', dot: 'bg-sky-500' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', dot: 'bg-pink-500' },
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
];

function pickPalette(companyId) {
  if (!companyId) return COMPANY_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < companyId.length; i++) hash = (hash * 31 + companyId.charCodeAt(i)) >>> 0;
  return COMPANY_PALETTE[hash % COMPANY_PALETTE.length];
}

function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0=일
  const diff = day === 0 ? -6 : 1 - day; // 월요일 시작
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function fmtYmd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dayLabel(d) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
}

export default function CrewScheduleList() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // 이번 주 월요일 ~ 다음 주 일요일 (2주치)
  const range = useMemo(() => {
    const start = startOfWeek(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 13);
    return { from: fmtYmd(start), to: fmtYmd(end), start, end };
  }, []);

  useEffect(() => {
    let alive = true;
    crewApi.schedules(range.from, range.to)
      .then((data) => { if (alive) { setSchedules(data.schedules || []); setLoading(false); } })
      .catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [range.from, range.to]);

  // 일자별 그루핑 + 회사 다양성 추적 (더블 부킹)
  const byDate = useMemo(() => {
    const map = new Map();
    for (const s of schedules) {
      const key = fmtYmd(new Date(s.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return map;
  }, [schedules]);

  // 이번 주 / 다음 주 분리
  const thisWeekEnd = useMemo(() => {
    const e = new Date(range.start);
    e.setDate(e.getDate() + 6);
    return e;
  }, [range.start]);

  function dayList(startDate, days) {
    const out = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }

  if (loading) {
    return (
      <section className="bg-white dark:bg-slate-900 rounded-lg p-5 text-center text-gray-400 text-sm">
        일정 불러오는 중...
      </section>
    );
  }

  if (schedules.length === 0) {
    return null; // 일정 없으면 섹션 자체 숨김 (거래 회사 카드만 노출)
  }

  return (
    <section className="bg-white dark:bg-slate-900 rounded-lg p-5 shadow-sm dark:ring-1 dark:ring-white/5 space-y-5">
      <div className="text-sm font-semibold">
        📅 일정 <span className="text-gray-400">({schedules.length})</span>
      </div>

      <WeekBlock title="이번 주" days={dayList(range.start, 7)} byDate={byDate} />
      <WeekBlock title="다음 주" days={dayList(new Date(thisWeekEnd.getTime() + 24 * 60 * 60 * 1000), 7)} byDate={byDate} />
    </section>
  );
}

function WeekBlock({ title, days, byDate }) {
  const hasAny = days.some((d) => byDate.has(fmtYmd(d)));
  if (!hasAny) return null;
  return (
    <div>
      <div className="text-xs text-gray-500 font-medium mb-2">{title}</div>
      <ul className="space-y-2">
        {days.map((d) => {
          const list = byDate.get(fmtYmd(d)) || [];
          if (list.length === 0) return null;
          const companyIds = new Set(list.map((s) => s.company?.id).filter(Boolean));
          const isDoubleBooking = companyIds.size >= 2;
          return (
            <li key={fmtYmd(d)}>
              <div className="flex items-center gap-2 text-xs mb-1.5">
                <span className="font-medium text-gray-700 dark:text-gray-300">{dayLabel(d)}</span>
                {isDoubleBooking && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    ⚠️ 같은 날 회사 {companyIds.size}곳
                  </span>
                )}
              </div>
              <ul className="space-y-1.5">
                {list.map((s) => {
                  const palette = pickPalette(s.company?.id);
                  return (
                    <li
                      key={s.id}
                      className={`flex gap-2 items-start p-2.5 rounded border ${palette.bg} ${palette.border}`}
                    >
                      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${palette.dot}`} />
                      <div className="flex-1 min-w-0 text-sm">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-semibold ${palette.text}`}>{s.company?.name || '회사 미상'}</span>
                          {s.project?.name && (
                            <span className="text-gray-600 dark:text-gray-400 text-xs">· {s.project.name}</span>
                          )}
                          {s.vendor?.category && (
                            <span className="text-xs text-gray-500">· {s.vendor.category}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 mt-0.5 whitespace-pre-wrap break-words">
                          {s.content}
                        </div>
                        {s.project?.address && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate">{s.project.address}</div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
