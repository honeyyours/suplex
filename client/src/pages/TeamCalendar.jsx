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
import MobileCompanyScheduleSheet from '../components/MobileCompanyScheduleSheet';

const ROLE_LABEL = { OWNER: '대표', DESIGNER: '디자이너', FIELD: '현장팀' };

function memberDisplay(m) {
  // 회사 영역에선 본명만 표시 — 닉네임은 라운지 전용
  return m.name;
}

// 회사별 색상 팔레트 — 시공팀 모드에서 거래 회사 일정 분리 표시용
const CREW_COMPANY_PALETTE = [
  'bg-sky-100 text-sky-800 border-sky-300',
  'bg-emerald-100 text-emerald-800 border-emerald-300',
  'bg-violet-100 text-violet-800 border-violet-300',
  'bg-amber-100 text-amber-800 border-amber-300',
  'bg-rose-100 text-rose-800 border-rose-300',
  'bg-cyan-100 text-cyan-800 border-cyan-300',
  'bg-pink-100 text-pink-800 border-pink-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
];
function crewCompanyColor(companyId) {
  if (!companyId) return CREW_COMPANY_PALETTE[0];
  let h = 0;
  for (let i = 0; i < companyId.length; i++) h = (h * 31 + companyId.charCodeAt(i)) >>> 0;
  return CREW_COMPANY_PALETTE[h % CREW_COMPANY_PALETTE.length];
}

export default function TeamCalendar({ crewExtraEntries = [] } = {}) {
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
  const ownEntries = data?.entries || [];
  // 시공팀 모드: 거래 회사 vendor 매핑 일정도 같은 캘린더에 합쳐 표시 (읽기 전용, 회사 색상)
  const entries = useMemo(() => {
    if (!crewExtraEntries || crewExtraEntries.length === 0) return ownEntries;
    const extras = crewExtraEntries.map((e) => ({
      ...e,
      date: typeof e.date === 'string' ? e.date : new Date(e.date).toISOString(),
      isExternal: true,
      externalCompanyId: e.company?.id || null,
      externalCompanyName: e.company?.name || null,
      externalProjectId: e.project?.id || null,
      externalProjectName: e.project?.name || null,
      externalProjectAddress: e.project?.siteAddress || null,
      externalCategory: e.vendor?.category || e.category || null,
      externalVendorName: e.vendor?.name || null,
    }));
    return [...ownEntries, ...extras];
  }, [ownEntries, crewExtraEntries]);

  // 외부 일정 클릭 → 상세 모달 + 카톡 복사
  const [externalDetail, setExternalDetail] = useState(null); // entry | null

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
    dateEnd: '', // 비어있으면 단일 일정. 채우면 기간 일정 (시작~종료 매일 row 생성)
    content: '',
    projectId: '',
    vendorId: '',
    assigneeId: '',
    isPrivate: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // 셀 인라인 입력(데스크톱) — 캘린더 셀 클릭 시 활성화. 빠른 추가용 (담당자=현재 필터, isPrivate=false).
  const [activeCellKey, setActiveCellKey] = useState(null);
  // 모바일에서 셀 탭 시 뜨는 바텀시트 — 자세히 보기·수정·추가
  const [mobileSheetKey, setMobileSheetKey] = useState(null);

  // 모바일에서 입력 폼은 기본 접힘 (셀 인라인으로 빠른 추가 가능, 자세한 옵션은 토글).
  const [mobileFormOpen, setMobileFormOpen] = useState(false);

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
      // 종료일이 시작일보다 이르거나 같으면 단일 일정(dateEnd 미전송).
      const dateEnd = form.dateEnd && form.dateEnd > form.date ? form.dateEnd : null;
      await companySchedulesApi.create({
        date: form.date,
        dateEnd,
        content: form.content.trim(),
        projectId: form.projectId || null,
        vendorId: form.vendorId || null,
        assigneeId: form.assigneeId || null,
        isPrivate: form.isPrivate,
      });
      setForm({ ...form, content: '', projectId: '', vendorId: '', isPrivate: false, dateEnd: '' });
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
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-navy-800 dark:text-navy-200">팀 캘린더</h1>
          <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 mt-1">
            회사 자체 일정 · 견적미팅 · 사무실미팅 · 디자이너·현장팀 개인 일정. 연관 프로젝트 연결 시 프로젝트 일정에도 함께 노출됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setMobileFormOpen((o) => !o)}
          className="sm:hidden flex-shrink-0 text-xs px-2.5 py-1.5 border border-navy-200 dark:border-navy-700 text-navy-700 dark:text-navy-300 rounded-md whitespace-nowrap"
          aria-expanded={mobileFormOpen}
        >
          {mobileFormOpen ? '닫기' : '+ 자세히 추가'}
        </button>
      </div>

      {/* 멤버 필터 칩 — 모바일은 가로 스크롤로 한 줄 유지 */}
      <div className="-mx-2 sm:mx-0 px-2 sm:px-0 overflow-x-auto sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex items-center gap-1.5 flex-nowrap sm:flex-wrap">
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
      </div>

      {/* 입력 폼 — 데스크톱은 항상, 모바일은 토글 */}
      <form
        onSubmit={submit}
        className={`${mobileFormOpen ? 'block' : 'hidden'} sm:block bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-3 space-y-2`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-[140px_140px_1fr_auto] gap-2">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900"
            required
            title="시작일"
          />
          <input
            type="date"
            value={form.dateEnd}
            onChange={(e) => setForm({ ...form, dateEnd: e.target.value })}
            min={form.date}
            className="border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900"
            title="종료일 (비워두면 단일 일정, 채우면 시작일부터 매일 자동 생성)"
            placeholder="종료일 (선택)"
          />
          <input
            type="text"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="예: 김부장님 디자인 미팅, 가산점 답사, 직원 회식"
            className="col-span-2 sm:col-span-1 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-900"
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

        <div className="border-y sm:border sm:rounded-lg overflow-hidden bg-white dark:bg-slate-800 select-none sm:select-auto">
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
                if (window.innerWidth < 640) {
                  setMobileSheetKey(key);
                } else {
                  setActiveCellKey(key);
                }
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

                  {/* 모바일 — 시각 표시만, 모든 클릭은 셀로 전파 (시트 열림) */}
                  <div className="sm:hidden px-0.5 pb-0.5 flex flex-col gap-0.5 flex-1 overflow-hidden pointer-events-none">
                    {dayEntries.slice(0, 3).map((e) => <MobileEntryBar key={e.id} entry={e} />)}
                    {dayEntries.length > 3 && (
                      <span className="text-[11px] text-gray-400 text-center leading-none mt-0.5">
                        +{dayEntries.length - 3}
                      </span>
                    )}
                  </div>

                  {/* 데스크톱 — lane 모드: 같은 주에서 같은 프로젝트는 같은 행 */}
                  <div className="hidden sm:flex sm:flex-col px-1 pb-1 gap-0.5 flex-1 overflow-hidden">
                    {slots.map((e, i) =>
                      e ? <EntryCard key={e.id} entry={e} onRemove={() => remove(e.id)} onExternalClick={setExternalDetail} /> : <TeamEmptySlot key={`empty-${i}`} />
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

      {mobileSheetKey && (
        <MobileCompanyScheduleSheet
          dateKey={mobileSheetKey}
          entries={byDate[mobileSheetKey] || []}
          members={members}
          projects={activeProjects}
          vendors={vendors}
          assigneeFilter={assigneeFilter}
          onClose={() => setMobileSheetKey(null)}
          onAdd={async (payload) => {
            await companySchedulesApi.create({ date: mobileSheetKey, ...payload });
            reload();
          }}
          onUpdate={async (id, payload) => {
            await companySchedulesApi.update(id, payload);
            reload();
          }}
          onDelete={async (id) => {
            await companySchedulesApi.remove(id);
            reload();
          }}
        />
      )}

      {externalDetail && (
        <CrewExternalDetailModal
          entry={externalDetail}
          onClose={() => setExternalDetail(null)}
        />
      )}
    </div>
  );
}

// 시공팀 캘린더 — 거래 회사에서 넘어온 일정 카드 클릭 시 상세 모달.
// 회사·프로젝트·주소·공종·내용·날짜·확정 상태 표시 + 카톡 복사 버튼.
function CrewExternalDetailModal({ entry: e, onClose }) {
  const [copied, setCopied] = useState(false);
  const dateLabel = (() => {
    const d = new Date(e.date);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`;
  })();
  const lines = [
    `[${e.externalCompanyName || '거래 회사'}] ${e.externalProjectName || ''}`.trim(),
    `일정: ${dateLabel}`,
    e.externalCategory ? `공종: ${e.externalCategory}` : null,
    e.content ? `내용: ${e.content}` : null,
    e.externalProjectAddress ? `주소: ${e.externalProjectAddress}` : null,
    `상태: ${e.confirmed ? '확정' : '미확정'}`,
  ].filter(Boolean);
  const copyText = lines.join('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = copyText; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-900 rounded-t-xl sm:rounded-xl shadow-xl dark:ring-1 dark:ring-white/5 w-full sm:max-w-md max-h-[80vh] overflow-y-auto"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 px-5 py-4 border-b dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-navy-800 dark:text-navy-200">
              {e.externalCompanyName || '거래 회사'}
            </div>
            {e.externalProjectName && (
              <div className="text-sm text-gray-500 mt-0.5">{e.externalProjectName}</div>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <Row label="일정" value={dateLabel} />
          {e.externalCategory && <Row label="공종" value={e.externalCategory} />}
          {e.content && <Row label="내용" value={e.content} />}
          {e.externalProjectAddress && <Row label="주소" value={e.externalProjectAddress} />}
          <Row
            label="상태"
            value={e.confirmed
              ? <span className="text-emerald-700 font-semibold">확정</span>
              : <span className="text-amber-700">미확정</span>}
          />
          <div className="pt-1 text-xs text-gray-500 leading-relaxed">
            거래 회사가 잡은 일정입니다. 변경은 거래 회사 측에서만 가능합니다.
          </div>
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={copy}
            className="w-full bg-navy-700 hover:bg-navy-800 text-white font-medium py-2.5 rounded-md"
          >
            {copied ? '복사됨' : '카톡 복사'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-500 w-12 flex-shrink-0">{label}</span>
      <span className="text-gray-800 dark:text-gray-200 break-words flex-1">{value}</span>
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
  const base = 'px-2.5 py-1 rounded-full text-xs font-medium transition border whitespace-nowrap flex-shrink-0';
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

// 모바일용 — 시각 정보만. 클릭/터치 이벤트는 셀(시트)로 흐르도록 pointer-events-none 셀 컨테이너에서 처리.
function MobileEntryBar({ entry: e }) {
  const projColor = e.project ? projectClass(e.project.id) : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
  return (
    <div
      className={`text-[10px] rounded-sm pl-0.5 pr-0.5 py-0 truncate flex items-center gap-1 ${projColor}`}
    >
      {e.isPrivate && <span className="opacity-70" aria-hidden="true">🔒</span>}
      <span className="truncate">{e.content}</span>
    </div>
  );
}

function EntryCard({ entry: e, onRemove, onExternalClick }) {
  // 시공팀 모드 외부(거래 회사) 일정 — 회사 색상·읽기 전용 + 클릭 시 모달
  // 확정 = 실선 테두리, 미확정 = 점선 테두리(투명도 ↓)
  if (e.isExternal) {
    const extCls = crewCompanyColor(e.externalCompanyId);
    const isConfirmed = !!e.confirmed;
    const titleExt = `[${e.externalCompanyName || '거래 회사'}]${e.externalProjectName ? ' · ' + e.externalProjectName : ''} · ${e.content}${isConfirmed ? ' · 확정' : ' · 미확정'}`;
    return (
      <button
        type="button"
        data-entry
        onClick={(ev) => { ev.stopPropagation(); onExternalClick?.(e); }}
        className={`relative w-full text-left text-[10px] sm:text-sm rounded-sm sm:rounded leading-tight pl-0.5 pr-0.5 py-0 sm:px-1.5 sm:py-0.5 truncate border ${isConfirmed ? '' : 'border-dashed opacity-65'} ${extCls} hover:brightness-95`}
        title={titleExt}
      >
        <span className="flex items-center gap-1 truncate">
          <span className="truncate">{e.externalCompanyName ? `${e.externalCompanyName} · ` : ''}{e.content}</span>
        </span>
      </button>
    );
  }
  const projColor = e.project ? projectClass(e.project.id) : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
  const projBorder = e.project ? projectBorderClass(e.project.id) : 'border-slate-400';
  const inner = (
    <span className="flex items-center gap-1 truncate flex-1">
      {e.isPrivate && <span className="text-[10px] opacity-70" title="나만보기">🔒</span>}
      <span className="truncate">{e.content}</span>
    </span>
  );
  const titleText = `${e.project ? e.project.name + ' · ' : ''}${e.content}${e.isPrivate ? ' · 나만보기' : ''}`;
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
