// 팀 캘린더 v2 — 회사 일정 + 디자이너·현장팀 개인별 캘린더 (2026-05-17 갱신)
// AggregateCalendar 스타일의 그리드 + 멤버 필터 칩 + 입력 폼.
// 봉기님 일정 시리즈 UI 일관성 유지.
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { companySchedulesApi } from '../api/companySchedules';
import { projectsApi } from '../api/projects';
import { vendorsApi } from '../api/vendors';
import {
  toDateKey, calendarGrid, addMonths, formatMonthLabel, projectClass, projectBorderClass,
} from '../utils/date';
import { buildLaneInfo, assignSlots } from '../utils/calendarLane';
import { getHoliday } from '../utils/holidays';
import InlineScheduleInput from '../components/InlineScheduleInput';

const ROLE_LABEL = { OWNER: '대표', DESIGNER: '디자이너', FIELD: '현장팀' };

function memberDisplay(m) {
  // 닉네임 우선, 없으면 이름
  return m.nickname || m.name;
}

export default function TeamCalendar() {
  const queryClient = useQueryClient();
  const [current, setCurrent] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [assigneeFilter, setAssigneeFilter] = useState(''); // '' = 전체, 'unassigned' = 미배정, userId

  const grid = useMemo(
    () => calendarGrid(current.getFullYear(), current.getMonth()),
    [current]
  );
  const rangeStart = grid[0];
  const rangeEnd = grid[grid.length - 1];
  const startKey = toDateKey(rangeStart);
  const endKey = toDateKey(rangeEnd);

  const { data, isLoading } = useQuery({
    queryKey: ['company-schedules', startKey, endKey, assigneeFilter],
    queryFn: () => companySchedulesApi.list({
      from: startKey,
      to: endKey,
      assigneeId: assigneeFilter || undefined,
    }),
  });
  const entries = data?.entries || [];

  const { data: membersData } = useQuery({
    queryKey: ['team', 'members'],
    queryFn: () => api.get('/team/members').then((r) => r.data),
  });
  const members = membersData?.members || [];

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'team-calendar'],
    queryFn: () => projectsApi.list(),
  });
  const projects = projectsData?.projects || projectsData?.items || [];
  const activeProjects = projects.filter((p) =>
    ['PLANNED', 'IN_PROGRESS', 'ON_HOLD'].includes(p.status)
  );

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors', 'team-calendar'],
    queryFn: () => vendorsApi.list(),
  });
  const vendors = vendorsData?.vendors || vendorsData?.items || [];

  function reload() {
    return queryClient.invalidateQueries({ queryKey: ['company-schedules'] });
  }

  // 입력 폼 상태
  const [form, setForm] = useState({
    date: toDateKey(new Date()),
    content: '',
    projectId: '',
    vendorId: '',
    assigneeId: '',
    isPrivate: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // 셀 인라인 입력 — 캘린더 셀 클릭 시 활성화. 빠른 추가용 (담당자=현재 필터, isPrivate=false).
  const [activeCellKey, setActiveCellKey] = useState(null);

  async function quickAddInCell(dateKey, content) {
    try {
      await companySchedulesApi.create({
        date: dateKey,
        content,
        assigneeId: (assigneeFilter && assigneeFilter !== 'unassigned') ? assigneeFilter : null,
      });
      reload();
    } catch (e) {
      console.error('quickAdd failed:', e);
    }
  }

  const navigateCell = useCallback((currentKey, direction) => {
    if (direction === 'esc') {
      setActiveCellKey(null);
      return;
    }
    const idx = grid.findIndex((d) => toDateKey(d) === currentKey);
    if (idx < 0) return;
    let step;
    if (direction === 'next') step = 1;
    else if (direction === 'prev') step = -1;
    else if (direction === 'down') step = 7;
    else if (direction === 'up') step = -7;
    else { setActiveCellKey(null); return; }
    const target = idx + step;
    if (target < 0 || target >= grid.length) { setActiveCellKey(null); return; }
    setActiveCellKey(toDateKey(grid[target]));
  }, [grid]);

  async function submit(e) {
    e?.preventDefault?.();
    if (!form.content.trim()) {
      setErr('내용을 입력해주세요');
      return;
    }
    setErr('');
    setBusy(true);
    try {
      await companySchedulesApi.create({
        date: form.date,
        content: form.content.trim(),
        projectId: form.projectId || null,
        vendorId: form.vendorId || null,
        assigneeId: form.assigneeId || null,
        isPrivate: form.isPrivate,
      });
      setForm({ ...form, content: '', projectId: '', vendorId: '', isPrivate: false });
      reload();
    } catch (e) {
      setErr(e.response?.data?.error || '추가 실패');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!confirm('이 일정을 삭제할까요?')) return;
    try {
      await companySchedulesApi.remove(id);
      reload();
    } catch (e) {
      alert(e.response?.data?.error || '삭제 실패');
    }
  }

  const byDate = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const key = e.date.slice(0, 10);
      (map[key] = map[key] || []).push(e);
    });
    return map;
  }, [entries]);

  // 주별 lane — 같은 프로젝트는 같은 행에 정렬
  const weekLaneInfo = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));
    return weeks.map((week) => buildLaneInfo(week, byDate));
  }, [grid, byDate]);

  // 하단 현장 인덱스 — 이번 달에 프로젝트가 연결된 일정만
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
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold text-navy-800 dark:text-navy-200">팀 캘린더</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          회사 자체 일정 · 견적미팅 · 사무실미팅 · 디자이너·현장팀 개인 일정. 연관 프로젝트 연결 시 프로젝트 일정에도 함께 노출됩니다.
        </p>
      </div>

      {/* 멤버 필터 칩 */}
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterChip
          label="전체"
          active={assigneeFilter === ''}
          onClick={() => setAssigneeFilter('')}
        />
        {members.map((m) => (
          <FilterChip
            key={m.userId}
            label={`${memberDisplay(m)} · ${ROLE_LABEL[m.role] || m.role}`}
            active={assigneeFilter === m.userId}
            onClick={() => setAssigneeFilter(m.userId)}
          />
        ))}
        <FilterChip
          label="미배정"
          active={assigneeFilter === 'unassigned'}
          onClick={() => setAssigneeFilter('unassigned')}
          muted
        />
      </div>

      {/* 입력 폼 */}
      <form
        onSubmit={submit}
        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 space-y-2"
      >
        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr_auto] gap-2">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900"
            required
          />
          <input
            type="text"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="예: 김부장님 디자인 미팅, 가산점 답사, 직원 회식"
            className="border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900"
          />
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 bg-navy-700 text-white rounded-md text-sm font-medium hover:bg-navy-800 disabled:opacity-60 whitespace-nowrap"
          >
            {busy ? '추가 중...' : '+ 추가'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
          <label className="flex items-center gap-1.5">
            <span>담당자:</span>
            <select
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs bg-white dark:bg-slate-900"
            >
              <option value="">— 전체/미배정 —</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {memberDisplay(m)} ({ROLE_LABEL[m.role] || m.role})
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span>프로젝트:</span>
            <select
              value={form.projectId}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs bg-white dark:bg-slate-900 min-w-[140px]"
              title="선택 시 해당 프로젝트 일정에도 함께 노출됩니다"
            >
              <option value="">— 없음 —</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5">
            <span>거래처:</span>
            <select
              value={form.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
              className="border border-gray-300 dark:border-slate-600 rounded px-2 py-1 text-xs bg-white dark:bg-slate-900 min-w-[120px]"
            >
              <option value="">— 없음 —</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPrivate}
              onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
              className="w-3.5 h-3.5 accent-navy-700"
            />
            <span title="작성자 본인과 담당자에게만 보이는 일정">나만보기</span>
          </label>
        </div>
        {err && <div className="text-sm text-rose-600">{err}</div>}
      </form>

      {/* 캘린더 그리드 — AggregateCalendar 스타일 */}
      <div>
        <div className="flex items-center mb-2 gap-2 px-2 sm:px-0">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrent(addMonths(current, -1))}
              className="text-navy-700 dark:text-navy-300 hover:text-navy-900 dark:hover:text-navy-100 text-base sm:text-lg leading-none px-1 py-0.5"
              aria-label="이전 달"
            >‹</button>
            <div className="font-semibold text-base sm:text-lg text-navy-800 dark:text-navy-200 whitespace-nowrap">
              {formatMonthLabel(current)}
            </div>
            <button
              onClick={() => setCurrent(addMonths(current, 1))}
              className="text-navy-700 dark:text-navy-300 hover:text-navy-900 dark:hover:text-navy-100 text-base sm:text-lg leading-none px-1 py-0.5"
              aria-label="다음 달"
            >›</button>
            {isLoading && <span className="text-xs text-gray-400 ml-1">불러오는 중...</span>}
          </div>
          <div className="flex-1" />
        </div>

        <div className="border-y sm:border sm:rounded-lg overflow-hidden bg-white dark:bg-slate-800">
          <div className="grid grid-cols-7 text-[11px] sm:text-xs font-semibold bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div
                key={d}
                className={`px-1 sm:px-2 py-1.5 sm:py-2 text-center ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'
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
              const isActive = activeCellKey === key;
              const holiday = getHoliday(date);
              const isRed = dayOfWeek === 0 || !!holiday;
              function handleCellClick(ev) {
                if (ev.target.closest('a, button, input, select, textarea, [data-entry]')) return;
                setActiveCellKey(key);
              }
              return (
                <div
                  key={key}
                  onClick={handleCellClick}
                  className={`border-r border-b border-gray-200 dark:border-slate-700 last:border-r-0 min-h-[75px] sm:min-h-[100px] flex flex-col overflow-hidden cursor-pointer ${
                    isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-900/30'
                  } ${isActive ? 'ring-2 ring-navy-500 ring-inset' : 'hover:bg-navy-50/40 dark:hover:bg-slate-700/40'}`}
                >
                  <div className={`px-1 py-0.5 sm:px-2 sm:py-1.5 text-[10px] sm:text-sm flex-shrink-0 flex items-baseline gap-1 ${
                    isRed ? 'text-red-500' : dayOfWeek === 6 ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'
                  }`}>
                    <span className={`${isToday ? 'bg-navy-700 text-white rounded-full px-1 sm:px-1.5' : ''} ${isFirstOfMonth && !isToday ? 'font-semibold text-navy-700 dark:text-navy-300' : ''}`}>
                      {isFirstOfMonth ? `${date.getMonth() + 1}/1` : date.getDate()}
                    </span>
                    {holiday && (
                      <span className="text-[9px] sm:text-[10px] text-red-500/80 truncate" title={holiday}>{holiday}</span>
                    )}
                  </div>

                  {/* 모바일 — 빽빽 */}
                  <div className="sm:hidden px-0.5 pb-0.5 flex flex-col gap-0.5 flex-1 overflow-hidden">
                    {dayEntries.slice(0, 3).map((e) => <EntryCard key={e.id} entry={e} onRemove={() => remove(e.id)} />)}
                    {!isActive && dayEntries.length > 3 && (
                      <span className="text-[11px] text-gray-400 text-center leading-none mt-0.5">
                        +{dayEntries.length - 3}
                      </span>
                    )}
                    {isActive && (
                      <div data-entry>
                        <InlineScheduleInput
                          onSave={(content) => quickAddInCell(key, content)}
                          onNavigate={(dir) => navigateCell(key, dir)}
                        />
                      </div>
                    )}
                  </div>

                  {/* 데스크톱 — lane 모드: 같은 주에서 같은 프로젝트는 같은 행 */}
                  <div className="hidden sm:flex sm:flex-col px-1 pb-1 gap-0.5 flex-1 overflow-hidden">
                    {slots.map((e, i) =>
                      e ? <EntryCard key={e.id} entry={e} onRemove={() => remove(e.id)} /> : <TeamEmptySlot key={`empty-${i}`} />
                    )}
                    {isActive && (
                      <div data-entry>
                        <InlineScheduleInput
                          onSave={(content) => quickAddInCell(key, content)}
                          onNavigate={(dir) => navigateCell(key, dir)}
                        />
                      </div>
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
    </div>
  );
}

function TeamEmptySlot() {
  return (
    <div className="text-sm leading-tight px-1.5 py-0.5 invisible" aria-hidden="true">
      &nbsp;
    </div>
  );
}

function FilterChip({ label, active, onClick, muted = false }) {
  const base = 'px-2.5 py-1 rounded-full text-xs font-medium transition border';
  const tone = active
    ? 'bg-navy-700 border-navy-700 text-white'
    : muted
      ? 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
      : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700';
  return (
    <button type="button" onClick={onClick} className={`${base} ${tone}`}>
      {label}
    </button>
  );
}

function EntryCard({ entry: e, onRemove }) {
  const projColor = e.project ? projectClass(e.project.id) : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
  const projBorder = e.project ? projectBorderClass(e.project.id) : 'border-slate-400';
  const inner = (
    <span className="flex items-center gap-1 truncate flex-1">
      {e.isPrivate && <span className="text-[10px] opacity-70" title="나만보기">🔒</span>}
      <span className="truncate">{e.content}</span>
      {e.assignee && (
        <span className="text-[10px] opacity-80 whitespace-nowrap">· {e.assignee.nickname || e.assignee.name}</span>
      )}
    </span>
  );
  const titleText = `${e.project ? e.project.name + ' · ' : ''}${e.content}${e.assignee ? ` · ${e.assignee.nickname || e.assignee.name}` : ''}${e.isPrivate ? ' · 나만보기' : ''}`;
  const cls = `relative text-[10px] sm:text-sm rounded-sm sm:rounded leading-tight pl-0.5 pr-0.5 py-0 sm:px-1.5 sm:py-0.5 truncate ${projColor} border-l-0 sm:border-l-[3px] ${projBorder} hover:brightness-95 group/entry`;
  if (e.project) {
    return (
      <Link data-entry to={`/projects/${e.project.id}/schedule`} className={cls} title={titleText}>
        {inner}
      </Link>
    );
  }
  return (
    <span
      data-entry
      onClick={(ev) => ev.stopPropagation()}
      onContextMenu={(ev) => { ev.preventDefault(); onRemove?.(); }}
      onDoubleClick={() => onRemove?.()}
      className={`${cls} cursor-default block`}
      title={titleText + '\n\n더블클릭 또는 우클릭으로 삭제'}
    >
      {inner}
    </span>
  );
}
