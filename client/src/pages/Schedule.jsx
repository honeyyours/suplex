import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import AggregateCalendar from '../components/AggregateCalendar';

const SUBTABS = [
  { key: 'all',       label: '전체일정' },
  { key: 'inProgress', label: '진행중 프로젝트별' },
  { key: 'planned',   label: '견적 일정 종합' },
];

export default function Schedule() {
  const [tab, setTab] = useState('all');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-navy-800">일정</h1>
        <div className="text-sm text-gray-500">
          현장팀이 가장 많이 보는 화면입니다
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex border-b px-2">
          {SUBTABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                tab === t.key
                  ? 'border-navy-700 text-navy-800'
                  : 'border-transparent text-gray-500 hover:text-navy-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'all' && <AggregateCalendar />}
          {tab === 'inProgress' && <InProgressProjectView />}
          {tab === 'planned' && (
            <div>
              <div className="mb-3 text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                💡 견적 단계(예정) 프로젝트들의 일정만 모아 보여드립니다.
              </div>
              <AggregateCalendar status="PLANNED" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InProgressProjectView() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('all'); // 'all' or projectId

  useEffect(() => {
    projectsApi
      .list({ status: 'IN_PROGRESS' })
      .then((r) => setProjects(r.projects || []))
      .finally(() => setLoading(false));
  }, []);

  const allIds = useMemo(() => projects.map((p) => p.id), [projects]);
  const filterIds = selectedId === 'all' ? allIds : [selectedId];

  if (loading) {
    return <div className="text-sm text-gray-400">불러오는 중...</div>;
  }
  if (projects.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-gray-500">
        진행중인 프로젝트가 없습니다.
        <div className="mt-3">
          <Link to="/projects" className="text-navy-700 hover:underline">
            프로젝트 목록 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
      {/* 프로젝트 칩 사이드바 */}
      <div className="space-y-1">
        <button
          onClick={() => setSelectedId('all')}
          className={`w-full text-left px-3 py-2 rounded text-sm font-medium ${
            selectedId === 'all'
              ? 'bg-navy-700 text-white'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          📋 전체 ({projects.length})
        </button>
        <div className="text-[11px] text-gray-400 px-2 pt-2">진행중 프로젝트</div>
        {projects.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedId(p.id)}
            className={`w-full text-left px-3 py-2 rounded text-sm truncate ${
              selectedId === p.id
                ? 'bg-navy-700 text-white'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
            title={p.name}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* 캘린더 */}
      <div>
        <AggregateCalendar projectIds={filterIds} />
      </div>
    </div>
  );
}
