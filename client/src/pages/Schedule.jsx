import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
import { schedulesApi } from '../api/schedules';
import { companyApi } from '../api/company';
import { useAuth } from '../contexts/AuthContext';
import AggregateCalendar from '../components/AggregateCalendar';
import AggregateChecklist from '../components/AggregateChecklist';
import ScheduleCalendar from '../components/ScheduleCalendar';
import ProjectInfoCard from '../components/ProjectInfoCard';
import ProjectChecklist from './ProjectChecklist';

const SUBTABS = [
  { key: 'site',    label: '현장 일정',  status: 'IN_PROGRESS' },
  { key: 'planned', label: '견적 일정',  status: 'PLANNED' },
  { key: 'all',     label: '전체 일정',  status: null },
];

export default function Schedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'site';
  const { auth } = useAuth();
  const { data: companyData } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyApi.get(),
  });
  const company = companyData?.company;

  const changeTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    next.delete('projectId');
    setSearchParams(next, { replace: true });
  };

  // 전체 탭 일정 추출 — 모달에서 키워드/기간 선택 후 fetch + 클립보드 복사
  const [extractAllOpen, setExtractAllOpen] = useState(false);
  async function runExtractAll({ keyword, start, end }) {
    try {
      const { entries } = await schedulesApi.listAll({ start, end });
      const filtered = filterByKeyword(entries, keyword);
      if (filtered.length === 0) {
        alert('해당 조건에 맞는 일정이 없습니다.');
        return;
      }
      const text = formatAllSchedulesForCopy(filtered, { company, user: auth?.user, range: { start, end, keyword } });
      await navigator.clipboard.writeText(text);
      alert(`${filtered.length}개 일정이 클립보드에 복사되었습니다.\n카톡으로 붙여넣어 전달하세요.`);
      setExtractAllOpen(false);
    } catch (e) {
      alert('일정 추출 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-navy-800">일정</h1>
      </div>

      <div className="bg-white border-y sm:border sm:rounded-xl overflow-hidden -mx-2 sm:mx-0">
        <div className="flex border-b px-2 overflow-x-auto">
          {SUBTABS.map((t) => (
            <button
              key={t.key}
              onClick={() => changeTab(t.key)}
              className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                tab === t.key
                  ? 'border-navy-700 text-navy-800'
                  : 'border-transparent text-gray-500 hover:text-navy-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-1 sm:p-5">
          {tab === 'site' && <FilterableProjectCalendar status="IN_PROGRESS" />}
          {tab === 'planned' && <FilterableProjectCalendar status="PLANNED" />}
          {tab === 'all' && (
            <>
              <div className="flex justify-end mb-2 px-2 sm:px-0">
                <button
                  onClick={() => setExtractAllOpen(true)}
                  className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50"
                  title="키워드/기간 선택 후 카톡 형식으로 클립보드 복사"
                >
                  일정 추출
                </button>
              </div>
              <AggregateCalendar />
              <div className="mt-6 pt-4 border-t">
                <h3 className="text-base font-bold text-navy-800 mb-3 px-2 sm:px-0">
                  ✅ 전체 체크리스트
                </h3>
                <AggregateChecklist />
              </div>
            </>
          )}
        </div>
      </div>

      {extractAllOpen && (
        <ExtractScheduleModal
          scope="all"
          defaultStart={isoDate(monthStart(new Date()))}
          defaultEnd={isoDate(monthEnd(new Date()))}
          onClose={() => setExtractAllOpen(false)}
          onExtract={runExtractAll}
        />
      )}
    </div>
  );
}

function FilterableProjectCalendar({ status }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('projectId') || 'all';
  const { auth } = useAuth();
  const { data: companyData } = useQuery({
    queryKey: ['company'],
    queryFn: () => companyApi.get(),
  });
  const company = companyData?.company;

  const setSelectedId = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('projectId');
    else next.set('projectId', id);
    setSearchParams(next, { replace: true });
  };

  // 전체(현재 status 필터 통과한 모든 프로젝트) 일정 추출
  const [extractScopedOpen, setExtractScopedOpen] = useState(false);
  async function runExtractScoped({ keyword, start, end }) {
    try {
      const { entries } = await schedulesApi.listAll({ start, end, projectIds: allIds });
      const filtered = filterByKeyword(entries, keyword);
      if (filtered.length === 0) {
        alert('해당 조건에 맞는 일정이 없습니다.');
        return;
      }
      const text = formatAllSchedulesForCopy(filtered, { company, user: auth?.user });
      await navigator.clipboard.writeText(text);
      alert(`${filtered.length}개 일정이 클립보드에 복사되었습니다.\n카톡으로 붙여넣어 전달하세요.`);
      setExtractScopedOpen(false);
    } catch (e) {
      alert('일정 추출 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  // 한 프로젝트 일정 추출 — 모달에서 키워드/기간 선택
  const [extractProjectModal, setExtractProjectModal] = useState(null); // {project, defaultStart, defaultEnd}
  function openProjectExtract(project) {
    const start = project.startDate ? isoDate(project.startDate) : isoDate(new Date());
    const end60 = new Date(); end60.setDate(end60.getDate() + 60);
    const endDate = project.expectedEndDate ? isoDate(project.expectedEndDate) : isoDate(end60);
    setExtractProjectModal({ project, defaultStart: start, defaultEnd: endDate });
  }
  async function runExtractProject({ keyword, start, end }) {
    if (!extractProjectModal) return;
    const { project } = extractProjectModal;
    try {
      const { entries } = await schedulesApi.list(project.id, { start, end });
      const filtered = filterByKeyword(entries, keyword);
      if (filtered.length === 0) {
        alert('해당 조건에 맞는 일정이 없습니다.');
        return;
      }
      const text = formatProjectScheduleForCopy(project, filtered, { company, user: auth?.user, range: { start, end, keyword } });
      await navigator.clipboard.writeText(text);
      alert(`${filtered.length}개 일정이 클립보드에 복사되었습니다.\n카톡으로 붙여넣어 전달하세요.`);
      setExtractProjectModal(null);
    } catch (e) {
      alert('일정 추출 실패: ' + (e.response?.data?.error || e.message));
    }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['projects', 'list', { status }],
    queryFn: () => projectsApi.list({ status }),
  });
  const projects = data?.projects || [];
  const loading = isLoading;

  const allIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const filterIds = selectedId === 'all' ? allIds : [selectedId];

  if (loading) {
    return <div className="text-sm text-gray-400">불러오는 중...</div>;
  }
  if (projects.length === 0) {
    const label = status === 'IN_PROGRESS' ? '진행중' : '예정 단계';
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        {label} 프로젝트가 없습니다.
        <div className="mt-3">
          <Link to="/projects" className="text-navy-700 hover:underline">
            프로젝트 목록 →
          </Link>
        </div>
      </div>
    );
  }

  const chips = (
    <>
      <ChipButton
        active={selectedId === 'all'}
        onClick={() => setSelectedId('all')}
      >
        📋 전체 ({projects.length})
      </ChipButton>
      {projects.map((p) => (
        <ChipButton
          key={p.id}
          active={selectedId === p.id}
          onClick={() => setSelectedId(p.id)}
          title={p.name}
        >
          <span className="truncate max-w-[140px] inline-block align-middle">{p.name}</span>
        </ChipButton>
      ))}
    </>
  );

  const selectedProject = selectedId !== 'all' ? projects.find((p) => p.id === selectedId) : null;

  return (
    <>
      <div className="sm:hidden border-b mb-2 overflow-x-auto">
        <div className="flex">
          <MobileProjectTab
            active={selectedId === 'all'}
            onClick={() => setSelectedId('all')}
          >
            전체 ({projects.length})
          </MobileProjectTab>
          {projects.map((p) => (
            <MobileProjectTab
              key={p.id}
              active={selectedId === p.id}
              onClick={() => setSelectedId(p.id)}
              title={p.name}
            >
              {p.name}
            </MobileProjectTab>
          ))}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1 overflow-x-auto px-2 sm:px-0 mb-3">
        {chips}
      </div>
      {selectedProject ? (
        <div className="space-y-4">
          <ProjectInfoCard
            project={selectedProject}
            compact
            actions={
              <>
                <button
                  onClick={() => openProjectExtract(selectedProject)}
                  className="text-xs px-2.5 py-1 border rounded hover:bg-gray-50 whitespace-nowrap"
                  title="키워드/기간 선택 후 카톡 형식으로 클립보드 복사"
                >
                  일정 추출
                </button>
                <Link
                  to={`/projects/${selectedProject.id}`}
                  className="text-xs px-2.5 py-1 bg-navy-700 text-white rounded hover:bg-navy-800 whitespace-nowrap"
                >
                  프로젝트 →
                </Link>
              </>
            }
          />
          <ScheduleCalendar projectId={selectedProject.id} project={selectedProject} />
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-2 px-2 sm:px-0">
            <button
              onClick={() => setExtractScopedOpen(true)}
              className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50"
              title={`현재 ${status === 'IN_PROGRESS' ? '진행중' : '예정'} 프로젝트 ${projects.length}개의 일정 추출`}
            >
              일정 추출
            </button>
          </div>
          <AggregateCalendar projectIds={filterIds} />
        </>
      )}
      <div className="mt-6 pt-4 border-t">
        {selectedProject ? (
          <>
            <h3 className="text-base font-bold text-navy-800 mb-3 px-2 sm:px-0">
              ✅ {selectedProject.name} 체크리스트
            </h3>
            <ProjectChecklist projectId={selectedProject.id} />
          </>
        ) : (
          <>
            <h3 className="text-base font-bold text-navy-800 mb-3 px-2 sm:px-0">
              ✅ 체크리스트
            </h3>
            <AggregateChecklist projectIds={allIds} />
          </>
        )}
      </div>

      {extractProjectModal && (
        <ExtractScheduleModal
          scope="project"
          projectName={extractProjectModal.project.name}
          defaultStart={extractProjectModal.defaultStart}
          defaultEnd={extractProjectModal.defaultEnd}
          onClose={() => setExtractProjectModal(null)}
          onExtract={runExtractProject}
        />
      )}

      {extractScopedOpen && (
        <ExtractScheduleModal
          scope="all"
          defaultStart={isoDate(monthStart(new Date()))}
          defaultEnd={isoDate(monthEnd(new Date()))}
          onClose={() => setExtractScopedOpen(false)}
          onExtract={runExtractScoped}
        />
      )}
    </>
  );
}

function MobileProjectTab({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`px-3 py-1.5 text-xs whitespace-nowrap border-b-2 flex-shrink-0 max-w-[160px] truncate ${
        active
          ? 'border-navy-700 text-navy-800 font-medium'
          : 'border-transparent text-gray-500'
      }`}
    >
      {children}
    </button>
  );
}

function ChipButton({ active, onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 border transition ${
        active
          ? 'bg-navy-700 text-white border-navy-700'
          : 'bg-white text-gray-700 border-gray-300 hover:border-navy-500 hover:text-navy-700'
      }`}
    >
      {children}
    </button>
  );
}

// ============================================
// 일정 추출 — 카톡 친화 형식 (자재 발주와 동일 패턴)
// ============================================
function monthStart(d) {
  const t = d instanceof Date ? d : new Date(d);
  return new Date(t.getFullYear(), t.getMonth(), 1);
}
function monthEnd(d) {
  const t = d instanceof Date ? d : new Date(d);
  return new Date(t.getFullYear(), t.getMonth() + 1, 0);
}
function filterByKeyword(entries, keyword) {
  const k = (keyword || '').trim();
  if (!k) return entries;
  const lc = k.toLowerCase();
  return entries.filter((e) =>
    (e.content || '').toLowerCase().includes(lc) ||
    (e.category || '').toLowerCase().includes(lc),
  );
}

// 추출 옵션 모달 — 키워드 / 기간 / "오늘부터" 체크
function ExtractScheduleModal({ scope, projectName, defaultStart, defaultEnd, onClose, onExtract }) {
  const [keyword, setKeyword] = useState('');
  const [fromToday, setFromToday] = useState(false);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [busy, setBusy] = useState(false);

  // "오늘부터" 체크 시 시작일을 오늘로 강제
  useEffect(() => {
    if (fromToday) setStart(isoDate(new Date()));
    else setStart(defaultStart);
  }, [fromToday, defaultStart]);

  function applyPreset(kind) {
    const today = new Date();
    if (kind === 'thisWeek') {
      // 오늘부터 7일
      const e = new Date(today); e.setDate(e.getDate() + 6);
      setStart(isoDate(today));
      setEnd(isoDate(e));
      setFromToday(true);
    } else if (kind === 'thisMonth') {
      setStart(isoDate(monthStart(today)));
      setEnd(isoDate(monthEnd(today)));
      setFromToday(false);
    } else if (kind === 'next30') {
      const e = new Date(today); e.setDate(e.getDate() + 30);
      setStart(isoDate(today));
      setEnd(isoDate(e));
      setFromToday(true);
    } else if (kind === 'projectRange') {
      setStart(defaultStart);
      setEnd(defaultEnd);
      setFromToday(false);
    }
  }

  async function handleExtract() {
    if (!start || !end) {
      alert('시작일과 종료일을 입력해주세요.');
      return;
    }
    if (start > end) {
      alert('시작일이 종료일보다 늦습니다.');
      return;
    }
    setBusy(true);
    try {
      await onExtract({ keyword: keyword.trim(), start, end });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="font-bold text-navy-800">
            일정 추출
            {scope === 'project' && projectName && (
              <span className="text-xs font-normal text-gray-500 ml-2">— {projectName}</span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <div className="p-5 space-y-4">
          {/* 키워드 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">공정/내용 검색 (선택)</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="예: 목공, 도배, 타일 (비우면 모두)"
              className="w-full text-sm px-3 py-2 border rounded outline-none focus:border-navy-400"
              autoFocus
            />
          </div>

          {/* 프리셋 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">빠른 선택</label>
            <div className="flex flex-wrap gap-1.5">
              {scope === 'project' && (
                <button onClick={() => applyPreset('projectRange')} className="text-xs px-2.5 py-1 border rounded hover:bg-gray-50">
                  프로젝트 전체 기간
                </button>
              )}
              <button onClick={() => applyPreset('thisWeek')} className="text-xs px-2.5 py-1 border rounded hover:bg-gray-50">
                이번 주
              </button>
              <button onClick={() => applyPreset('thisMonth')} className="text-xs px-2.5 py-1 border rounded hover:bg-gray-50">
                이번 달
              </button>
              <button onClick={() => applyPreset('next30')} className="text-xs px-2.5 py-1 border rounded hover:bg-gray-50">
                30일
              </button>
            </div>
          </div>

          {/* 오늘부터 + 기간 */}
          <div>
            <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={fromToday}
                onChange={(e) => setFromToday(e.target.checked)}
                className="w-4 h-4 accent-navy-700"
              />
              오늘부터 (시작일 자동)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">시작일</label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  disabled={fromToday}
                  className={`w-full text-sm px-2 py-1.5 border rounded outline-none focus:border-navy-400 ${fromToday ? 'bg-gray-100 text-gray-500' : ''}`}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">종료일</label>
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full text-sm px-2 py-1.5 border rounded outline-none focus:border-navy-400"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="border-t px-4 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={handleExtract}
            disabled={busy}
            className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-60"
          >
            {busy ? '추출 중…' : '추출 + 복사'}
          </button>
        </div>
      </div>
    </div>
  );
}

function isoDate(d) {
  const t = d instanceof Date ? d : new Date(d);
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const day = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const KOR_DOW = ['일', '월', '화', '수', '목', '금', '토'];
function formatKoreanDate(d) {
  const t = d instanceof Date ? d : new Date(d);
  const m = t.getMonth() + 1;
  const day = t.getDate();
  return `${m}월 ${String(day).padStart(2, ' ')}일 (${KOR_DOW[t.getDay()]})`;
}
function formatEntryLine(e) {
  const cat = e.category ? `[${e.category}] ` : '';
  return `- ${formatKoreanDate(e.date)} ${cat}${e.content || ''}`.trim();
}

// 한 프로젝트의 "현장 정보" 블록 (인사 다음 또는 일정 뒤에 붙임)
// userInfo는 단일 프로젝트(인사 붙는 본문)에서만 표시 — 전체 묶음에선 인사 영역에 한 번만 표시
function buildProjectInfoLines(project, { showHandler = false, userName = '', userPhone = '' } = {}) {
  const lines = [];
  lines.push(`현장: ${project.name || ''}`);
  if (project.siteAddress) lines.push(`주소: ${project.siteAddress}`);
  if (showHandler && (userName || userPhone)) {
    lines.push(`현장 담당자: ${[userName, userPhone].filter(Boolean).join(' ')}`);
  }
  if (project.siteNotes && project.siteNotes.trim()) {
    lines.push('현장 특이사항');
    for (const ln of project.siteNotes.split('\n')) {
      const s = ln.trim();
      if (s) lines.push(`  - ${s}`);
    }
  }
  return lines;
}

// 한 프로젝트 일정 → 텍스트 (순서: 인사 → 일정 → 현장 정보)
function formatProjectScheduleForCopy(project, entries, { company, user } = {}) {
  const lines = [];
  const companyName = company?.name || '';
  const userName = user?.name || '';
  const userPhone = user?.phone || company?.phone || '';

  lines.push(`안녕하세요, ${companyName ? companyName : '저희'}입니다.`);
  lines.push('아래 공사 일정 공유드립니다.');
  lines.push('');
  lines.push('[공사 일정]');
  for (const e of entries) lines.push(formatEntryLine(e));
  lines.push('');
  for (const ln of buildProjectInfoLines(project, { showHandler: true, userName, userPhone })) {
    lines.push(ln);
  }
  lines.push('');
  lines.push('일정 변동 시 미리 공유드리겠습니다. 감사합니다.');

  return lines.join('\n').trim();
}

// 회사 전체 일정 → 프로젝트별 묶음 텍스트 (각 프로젝트 = 일정 + 현장 정보)
function formatAllSchedulesForCopy(entries, { company, user } = {}) {
  const lines = [];
  const companyName = company?.name || '';
  const userName = user?.name || '';
  const userPhone = user?.phone || company?.phone || '';

  lines.push(`안녕하세요, ${companyName ? companyName : '저희'}입니다.`);
  lines.push('아래 공사 일정 공유드립니다.');
  if (userName || userPhone) {
    lines.push(`담당자: ${[userName, userPhone].filter(Boolean).join(' ')}`);
  }
  lines.push('');

  // 프로젝트별 묶음 — 각 묶음 안에 일정 + 현장 정보
  const byProject = new Map();
  for (const e of entries) {
    const key = e.project?.id || 'unknown';
    if (!byProject.has(key)) {
      byProject.set(key, { project: e.project || { name: '(프로젝트 미정)' }, list: [] });
    }
    byProject.get(key).list.push(e);
  }
  const projectKeys = [...byProject.keys()];
  projectKeys.forEach((key, idx) => {
    const { project, list } = byProject.get(key);
    if (idx > 0) lines.push('────────────────────');
    lines.push(`[${project.name || '(프로젝트 미정)'}]`);
    for (const e of list) lines.push(formatEntryLine(e));
    lines.push('');
    for (const ln of buildProjectInfoLines(project, { showHandler: false })) {
      lines.push(ln);
    }
    lines.push('');
  });
  lines.push('일정 변동 시 미리 공유드리겠습니다. 감사합니다.');
  return lines.join('\n').trim();
}
