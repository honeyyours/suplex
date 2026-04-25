import { useMemo } from 'react';
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

  // 전체 탭 일정 추출 — 회사 모든 프로젝트의 향후 60일 일정
  async function extractAllSchedules() {
    const today = new Date();
    const start = isoDate(today);
    const endDate = new Date(today); endDate.setDate(endDate.getDate() + 60);
    const end = isoDate(endDate);
    try {
      const { entries } = await schedulesApi.listAll({ start, end });
      if (!entries || entries.length === 0) {
        alert('추출할 일정이 없습니다 (오늘부터 60일 기준).');
        return;
      }
      const text = formatAllSchedulesForCopy(entries, { company, user: auth?.user });
      await navigator.clipboard.writeText(text);
      alert(`${entries.length}개 일정이 클립보드에 복사되었습니다.\n카톡으로 붙여넣어 전달하세요.`);
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
                  onClick={extractAllSchedules}
                  className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50"
                  title="향후 60일 전체 일정 카톡 형식으로 클립보드 복사"
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

  // 한 프로젝트 일정 추출 — 향후 60일
  async function extractProjectSchedule(project) {
    const today = new Date();
    const start = isoDate(today);
    const endDate = new Date(today); endDate.setDate(endDate.getDate() + 60);
    const end = isoDate(endDate);
    try {
      const { entries } = await schedulesApi.list(project.id, { start, end });
      if (!entries || entries.length === 0) {
        alert('추출할 일정이 없습니다 (오늘부터 60일 기준).');
        return;
      }
      const text = formatProjectScheduleForCopy(project, entries, { company, user: auth?.user });
      await navigator.clipboard.writeText(text);
      alert(`${entries.length}개 일정이 클립보드에 복사되었습니다.\n카톡으로 붙여넣어 전달하세요.`);
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
                  onClick={() => extractProjectSchedule(selectedProject)}
                  className="text-xs px-2.5 py-1 border rounded hover:bg-gray-50 whitespace-nowrap"
                  title="향후 60일 일정 카톡 형식으로 클립보드 복사"
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
        <AggregateCalendar projectIds={filterIds} />
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

// 한 프로젝트 일정 → 텍스트
function formatProjectScheduleForCopy(project, entries, { company, user } = {}) {
  const lines = [];
  const companyName = company?.name || '';
  const userName = user?.name || '';
  const userPhone = user?.phone || company?.phone || '';

  lines.push(`안녕하세요, ${companyName ? companyName : '저희'}입니다.`);
  lines.push('아래 공사 일정 공유드립니다.');
  lines.push('');
  lines.push(`현장: ${project.name || ''}`);
  if (project.siteAddress) lines.push(`주소: ${project.siteAddress}`);
  if (userName || userPhone) {
    lines.push(`현장 담당자: ${[userName, userPhone].filter(Boolean).join(' ')}`);
  }
  if (project.siteNotes && project.siteNotes.trim()) {
    lines.push('현장 특이사항');
    for (const ln of project.siteNotes.split('\n')) {
      const s = ln.trim();
      if (s) lines.push(`  - ${s}`);
    }
  }
  lines.push('');
  lines.push('[공사 일정]');
  for (const e of entries) lines.push(formatEntryLine(e));
  lines.push('');
  lines.push('일정 변동 시 미리 공유드리겠습니다. 감사합니다.');

  return lines.join('\n').trim();
}

// 회사 전체 일정 → 프로젝트별 묶음 텍스트
function formatAllSchedulesForCopy(entries, { company, user } = {}) {
  const lines = [];
  const companyName = company?.name || '';
  const userName = user?.name || '';
  const userPhone = user?.phone || company?.phone || '';

  lines.push(`안녕하세요, ${companyName ? companyName : '저희'}입니다.`);
  lines.push('아래 공사 일정 공유드립니다.');
  if (userName || userPhone) {
    lines.push('');
    lines.push(`담당자: ${[userName, userPhone].filter(Boolean).join(' ')}`);
  }
  lines.push('');

  // 프로젝트별 묶음
  const byProject = new Map();
  for (const e of entries) {
    const key = e.project?.id || 'unknown';
    if (!byProject.has(key)) byProject.set(key, { name: e.project?.name || '(프로젝트 미정)', list: [] });
    byProject.get(key).list.push(e);
  }
  for (const { name, list } of byProject.values()) {
    lines.push(`[${name}]`);
    for (const e of list) lines.push(formatEntryLine(e));
    lines.push('');
  }
  lines.push('일정 변동 시 미리 공유드리겠습니다. 감사합니다.');
  return lines.join('\n').trim();
}
