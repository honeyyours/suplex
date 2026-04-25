import { useEffect, useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import BackupMenu from '../components/BackupMenu';
import EditProjectModal from '../components/EditProjectModal';
import ProjectInfoCard from '../components/ProjectInfoCard';
import { simpleQuotesApi } from '../api/simpleQuotes';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);
  const [activeQuote, setActiveQuote] = useState(null);

  function reload() {
    api.get(`/projects/${id}`)
      .then((r) => setProject(r.data.project))
      .catch((e) => setErr(e.response?.data?.error || '프로젝트를 불러올 수 없습니다'));
  }

  // 활성 견적: ACCEPTED 상태 우선, 없으면 가장 최근 (작성중/발송됨)
  function reloadActiveQuote() {
    simpleQuotesApi.list(id)
      .then(({ quotes }) => {
        const active = quotes.find((q) => q.status === 'ACCEPTED') || quotes[0] || null;
        setActiveQuote(active);
      })
      .catch(() => setActiveQuote(null));
  }

  useEffect(() => {
    reload();
    reloadActiveQuote();
    /* eslint-disable-next-line */
  }, [id]);

  if (err) return <div className="bg-white rounded-xl border p-8 text-red-600">{err}</div>;
  if (!project) return <div className="text-sm text-gray-500">불러오는 중...</div>;

  const tab = ({ isActive }) =>
    `px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 transition ${
      isActive
        ? 'border-navy-700 text-navy-800'
        : 'border-transparent text-gray-500 hover:text-navy-700 hover:border-gray-300'
    }`;

  return (
    <div className="space-y-4">
      <ProjectInfoCard
        project={project}
        activeQuote={activeQuote}
        actions={
          <>
            <button
              onClick={() => setEditing(true)}
              className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
            >
              ✏️ 수정
            </button>
            <BackupMenu
              projectId={id}
              projectName={project.name}
              onRestored={(projects) => {
                if (projects[0]) navigate(`/projects/${projects[0].id}`);
              }}
            />
          </>
        }
      />

      <div className="bg-white border-y sm:border sm:rounded-xl overflow-hidden -mx-2 sm:mx-0">
        <div className="flex border-b px-2 overflow-x-auto">
          <NavLink to="quotes" className={tab}>견적</NavLink>
          <NavLink to="schedule" className={tab}>공정 일정</NavLink>
          <NavLink to="materials" className={tab}>마감재</NavLink>
          <NavLink to="orders" className={tab}>발주</NavLink>
          <NavLink to="checklist" className={tab}>체크리스트</NavLink>
          <NavLink to="reports" className={tab}>현장 보고</NavLink>
          <NavLink to="expenses" className={tab}>지출</NavLink>
        </div>
        <div className="p-1 sm:p-5">
          <Outlet context={{ project, reloadActiveQuote }} />
        </div>
      </div>

      {editing && (
        <EditProjectModal
          project={project}
          onClose={() => setEditing(false)}
          onSaved={(p) => setProject(p)}
          onDeleted={() => navigate('/')}
        />
      )}
    </div>
  );
}
