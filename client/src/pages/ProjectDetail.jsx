import { useEffect, useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import EditProjectModal from '../components/EditProjectModal';
import ProjectInfoCard from '../components/ProjectInfoCard';
import ProjectActionsMenu from '../components/ProjectActionsMenu';
import ProjectMembersModal from '../components/ProjectMembersModal';
import ExtractModal from '../components/ExtractModal';
import { simpleQuotesApi } from '../api/simpleQuotes';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const hideExpenses = !!auth?.company?.hideExpenses;
  const [project, setProject] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showExtract, setShowExtract] = useState(false);
  const [activeQuote, setActiveQuote] = useState(null);

  function reload() {
    api.get(`/projects/${id}`)
      .then((r) => setProject(r.data.project))
      .catch((e) => setErr(e.response?.data?.error || '프로젝트를 불러올 수 없습니다'));
  }

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

  if (err) return <div className="bg-white rounded-xl border p-8 text-rose-600">{err}</div>;
  if (!project) return <div className="text-sm text-gray-500">불러오는 중...</div>;

  const tab = ({ isActive }) =>
    `px-3 sm:px-4 py-3 sm:py-3 text-xs sm:text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 transition ${
      isActive
        ? 'border-navy-700 text-navy-800'
        : 'border-transparent text-gray-500 hover:text-navy-700 hover:border-gray-300'
    }`;

  const menuItems = [
    { label: '팀', onClick: () => setShowMembers(true) },
    { label: '수정', onClick: () => setEditing(true) },
    { label: '일정 복사', onClick: () => setShowExtract(true) },
  ];

  const headerActions = <ProjectActionsMenu items={menuItems} />;

  return (
    <div className="space-y-4">
      <ProjectInfoCard
        project={project}
        activeQuote={activeQuote}
        actions={headerActions}
      />

      <div className="bg-white border-y sm:border sm:rounded-xl overflow-hidden -mx-2 sm:mx-0">
        <div className="flex border-b px-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLink to="process" className={tab}>공정 현황</NavLink>
          <NavLink to="quote-consultations" className={tab}>견적상담</NavLink>
          <NavLink to="quotes" className={tab}>견적</NavLink>
          <NavLink to="schedule" className={tab}>공정 일정</NavLink>
          <NavLink to="materials" className={tab}>마감재</NavLink>
          <NavLink to="orders" className={tab}>발주</NavLink>
          <NavLink to="checklist" className={tab}>체크리스트</NavLink>
          <NavLink to="reports" className={tab}>현장 보고</NavLink>
          {!hideExpenses && <NavLink to="expenses" className={tab}>지출</NavLink>}
          {!hideExpenses && <NavLink to="settlement" className={tab}>정산</NavLink>}
          <NavLink to="tools" className={tab}>편의기능</NavLink>
          <NavLink to="memo" className={tab}>메모</NavLink>
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

      {/* 햄버거 메뉴에서 트리거 */}
      {showMembers && <ProjectMembersModal projectId={id} onClose={() => setShowMembers(false)} />}
      {showExtract && <ExtractModal projectId={id} project={project} onClose={() => setShowExtract(false)} />}
    </div>
  );
}
