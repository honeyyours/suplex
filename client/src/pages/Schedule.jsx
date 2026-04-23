import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../api/projects';
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

  const changeTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    next.delete('projectId');
    setSearchParams(next, { replace: true });
  };

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

  const setSelectedId = (id) => {
    const next = new URLSearchParams(searchParams);
    if (id === 'all') next.delete('projectId');
    else next.set('projectId', id);
    setSearchParams(next, { replace: true });
  };

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
                <Link
                  to={`/projects/${selectedProject.id}/reports`}
                  className="text-xs px-2.5 py-1 border rounded hover:bg-gray-50 whitespace-nowrap"
                >
                  📋 현장보고
                </Link>
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
