// 홈 상단 주간 브리프 카드.
// 이번주(월~일) + 다음주(월~일) 일정을 프로젝트별로 그루핑해 두 컬럼으로 요약.
// 같은 데이터 구조를 추후 금요일 알림톡 본문에도 재사용 (formatBriefAsText 헬퍼 노출).
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '../api/schedules';
import { toDateKey, addDays } from '../utils/date';

function getMonday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

function formatMD(d) {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function dayLabel(dateStr) {
  const d = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}

// entries(이미 날짜 정렬됐다고 가정) → 프로젝트별 그룹 배열
function groupByProject(entries) {
  const map = new Map();
  entries.forEach((e) => {
    const pid = e.project?.id;
    if (!pid) return;
    if (!map.has(pid)) {
      map.set(pid, { project: e.project, entries: [] });
    }
    map.get(pid).entries.push(e);
  });
  return Array.from(map.values());
}

// 알림톡 본문에 그대로 쓸 수 있는 텍스트 포맷 (재사용 목적).
// 호출 측은 thisWeek/nextWeek 그룹 배열을 넘김.
export function formatBriefAsText({ thisWeekGroups, nextWeekGroups, thisRange, nextRange }) {
  const lines = [];
  lines.push(`✅ 이번주 일정 (${thisRange})`);
  if (thisWeekGroups.length === 0) lines.push('  - 등록된 일정이 없습니다');
  thisWeekGroups.forEach((g) => {
    lines.push(`[${g.project.name}]`);
    g.entries.forEach((e) => {
      lines.push(`  - ${dayLabel(e.date)} ${e.category ? `[${e.category}] ` : ''}${e.content}`);
    });
  });
  lines.push('');
  lines.push(`📅 다음주 예정 (${nextRange})`);
  if (nextWeekGroups.length === 0) lines.push('  - 등록된 일정이 없습니다');
  nextWeekGroups.forEach((g) => {
    lines.push(`[${g.project.name}]`);
    g.entries.forEach((e) => {
      lines.push(`  - ${dayLabel(e.date)} ${e.category ? `[${e.category}] ` : ''}${e.content}`);
    });
  });
  return lines.join('\n');
}

export default function HomeWeeklyBrief() {
  const thisMonday = useMemo(() => getMonday(new Date()), []);
  const nextMonday = useMemo(() => addDays(thisMonday, 7), [thisMonday]);
  const thisSunday = useMemo(() => addDays(thisMonday, 6), [thisMonday]);
  const nextSunday = useMemo(() => addDays(nextMonday, 6), [nextMonday]);

  const startKey = toDateKey(thisMonday);
  const endKey = toDateKey(nextSunday);
  const nextMondayKey = toDateKey(nextMonday);

  const { data, isLoading } = useQuery({
    queryKey: ['weekly-brief', startKey, endKey],
    queryFn: () => schedulesApi.listAll({ start: startKey, end: endKey }),
  });
  const entries = data?.entries || [];

  const { thisWeekGroups, nextWeekGroups } = useMemo(() => {
    const tw = [];
    const nw = [];
    entries.forEach((e) => {
      const key = e.date.slice(0, 10);
      if (key < nextMondayKey) tw.push(e);
      else nw.push(e);
    });
    // 날짜 → orderIndex 순
    const sortFn = (a, b) =>
      a.date.localeCompare(b.date) || (a.orderIndex || 0) - (b.orderIndex || 0);
    tw.sort(sortFn);
    nw.sort(sortFn);
    return { thisWeekGroups: groupByProject(tw), nextWeekGroups: groupByProject(nw) };
  }, [entries, nextMondayKey]);

  const thisRange = `${formatMD(thisMonday)}~${formatMD(thisSunday)}`;
  const nextRange = `${formatMD(nextMonday)}~${formatMD(nextSunday)}`;

  return (
    <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-navy-800 dark:text-navy-200">📋 주간 브리프</h2>
        <Link
          to="/schedule"
          className="text-xs px-2.5 py-1 border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-300 rounded hover:bg-navy-50 dark:hover:bg-slate-800"
        >
          전체 일정 →
        </Link>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-400 py-6 text-center">불러오는 중...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BriefColumn
            title="✅ 이번주"
            range={thisRange}
            groups={thisWeekGroups}
            emptyText="이번주 등록된 일정이 없습니다"
          />
          <BriefColumn
            title="📅 다음주 예정"
            range={nextRange}
            groups={nextWeekGroups}
            emptyText="다음주 등록된 일정이 없습니다"
          />
        </div>
      )}
    </section>
  );
}

function BriefColumn({ title, range, groups, emptyText }) {
  const total = groups.reduce((s, g) => s + g.entries.length, 0);
  return (
    <div className="bg-gray-50/70 dark:bg-slate-800/40 rounded-lg p-3 sm:p-4">
      <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-gray-200 dark:border-slate-700">
        <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">
          {title}
          <span className="ml-1.5 text-xs text-gray-500">{range}</span>
        </div>
        {total > 0 && (
          <span className="text-xs text-gray-500">{total}건</span>
        )}
      </div>
      {groups.length === 0 ? (
        <div className="text-xs text-gray-400 py-3 text-center">{emptyText}</div>
      ) : (
        <ul className="space-y-3">
          {groups.map((g) => (
            <li key={g.project.id}>
              <Link
                to={`/projects/${g.project.id}/schedule`}
                className="text-sm font-semibold text-navy-700 dark:text-navy-300 hover:underline"
              >
                🏠 {g.project.name}
              </Link>
              <ul className="mt-1 space-y-0.5 pl-4">
                {g.entries.slice(0, 5).map((e) => (
                  <li
                    key={e.id}
                    className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed"
                  >
                    <span className="text-gray-500 mr-1.5 tabular-nums">{dayLabel(e.date)}</span>
                    {e.category && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 mr-1">
                        {e.category}
                      </span>
                    )}
                    <span className={e.confirmed ? '' : 'text-gray-600 dark:text-gray-400'}>
                      {e.content}
                    </span>
                    {e.confirmed && (
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400" title="확정">✓</span>
                    )}
                  </li>
                ))}
                {g.entries.length > 5 && (
                  <li className="text-xs text-gray-500 pl-1">+{g.entries.length - 5}건</li>
                )}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
