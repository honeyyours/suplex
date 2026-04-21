import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import BackupMenu from '../components/BackupMenu';
import AggregateCalendar from '../components/AggregateCalendar';
import AggregateChecklist from '../components/AggregateChecklist';

const TABS = [
  { key: 'calendar',   label: '전체 캘린더' },
  { key: 'checklists', label: '전체 체크리스트' },
];

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('calendar');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    projectsApi.list()
      .then((r) => setProjects(r.projects || []))
      .catch(() => setProjects([]));
  }, [reloadKey]);

  const active = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const planned = projects.filter((p) => p.status === 'PLANNED').length;
  const completed = projects.filter((p) => p.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold text-navy-800">대시보드</h1>
        <div className="flex gap-2">
          <BackupMenu onRestored={() => setReloadKey((k) => k + 1)} />
          <Link
            to="/projects"
            className="text-sm px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            프로젝트 전체 보기 →
          </Link>
          <Link
            to="/projects/new"
            className="bg-navy-700 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            + 새 프로젝트
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Stat label="진행중" value={active} color="text-sky-700" />
        <Stat label="예정" value={planned} color="text-amber-600" />
        <Stat label="완료" value={completed} color="text-emerald-600" />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex border-b px-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === t.key
                  ? 'border-navy-700 text-navy-800'
                  : 'border-transparent text-gray-500 hover:text-navy-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {activeTab === 'calendar' && <AggregateCalendar />}
          {activeTab === 'checklists' && <AggregateChecklist />}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${color}`}>{value}</div>
    </div>
  );
}
