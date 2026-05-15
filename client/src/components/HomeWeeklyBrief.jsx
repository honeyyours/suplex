// 홈 하단 주간 요약. 보고서 흐름: "이번주" 섹션 → "다음주 예정" 섹션, 위→아래로 읽힘.
// 한 줄에 프로젝트 1개, 일정이 가로 inline으로 펼쳐짐.
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
    const sortFn = (a, b) =>
      a.date.localeCompare(b.date) || (a.orderIndex || 0) - (b.orderIndex || 0);
    tw.sort(sortFn);
    nw.sort(sortFn);
    return { thisWeekGroups: groupByProject(tw), nextWeekGroups: groupByProject(nw) };
  }, [entries, nextMondayKey]);

  const thisRange = `${formatMD(thisMonday)}~${formatMD(thisSunday)}`;
  const nextRange = `${formatMD(nextMonday)}~${formatMD(nextSunday)}`;

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="text-sm text-gray-400 py-4 text-center">불러오는 중...</div>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <BriefSection
        label="이번주"
        range={thisRange}
        groups={thisWeekGroups}
        emptyText="이번주 등록된 일정이 없습니다"
      />
      <BriefSection
        label="다음주 예정"
        range={nextRange}
        groups={nextWeekGroups}
        emptyText="다음주 등록된 일정이 없습니다"
      />
    </div>
  );
}

function BriefSection({ label, range, groups, emptyText }) {
  const total = groups.reduce((s, g) => s + g.entries.length, 0);
  return (
    <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
      <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
        <h2 className="text-base font-bold text-navy-800 dark:text-navy-200">
          {label}
          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">{range}</span>
        </h2>
        {total > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{total}건</span>
        )}
      </div>
      {groups.length === 0 ? (
        <div className="text-sm text-gray-400 py-3 text-center">{emptyText}</div>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-slate-800">
          {groups.map((g) => (
            <ProjectRow key={g.project.id} group={g} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ProjectRow({ group }) {
  const { project, entries } = group;
  const visible = entries.slice(0, 8);
  const remaining = entries.length - visible.length;
  return (
    <li className="py-2 sm:py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
      <Link
        to={`/projects/${project.id}/schedule`}
        className="text-sm font-semibold text-navy-700 dark:text-navy-300 hover:underline shrink-0 sm:w-44 sm:truncate"
        title={project.name}
      >
        {project.name}
      </Link>
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 text-xs text-gray-700 dark:text-gray-300 flex-1">
        {visible.map((e) => (
          <span key={e.id} className="inline-flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-gray-500 dark:text-gray-400 tabular-nums">{dayLabel(e.date)}</span>
            {e.category && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300">
                {e.category}
              </span>
            )}
            <span className={e.confirmed ? '' : 'text-gray-600 dark:text-gray-400'}>
              {e.content}
            </span>
            {e.confirmed && (
              <span className="text-emerald-600 dark:text-emerald-400" title="확정">✓</span>
            )}
          </span>
        ))}
        {remaining > 0 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">+{remaining}건</span>
        )}
      </div>
    </li>
  );
}
