import { useEffect, useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import BackupMenu from '../components/BackupMenu';
import EditProjectModal from '../components/EditProjectModal';
import { formatDateDot, weeksBetween } from '../utils/date';

const STATUS_LABEL = {
  PLANNED: { label: '예정', color: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: '진행중', color: 'bg-sky-100 text-sky-700' },
  ON_HOLD: { label: '보류', color: 'bg-gray-200 text-gray-700' },
  COMPLETED: { label: '완료', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);

  function reload() {
    api.get(`/projects/${id}`)
      .then((r) => setProject(r.data.project))
      .catch((e) => setErr(e.response?.data?.error || '프로젝트를 불러올 수 없습니다'));
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [id]);

  if (err) return <div className="bg-white rounded-xl border p-8 text-red-600">{err}</div>;
  if (!project) return <div className="text-sm text-gray-500">불러오는 중...</div>;

  const status = STATUS_LABEL[project.status] || STATUS_LABEL.PLANNED;
  const weeks = weeksBetween(project.startDate, project.expectedEndDate);

  const tab = ({ isActive }) =>
    `px-4 py-2 text-sm font-medium border-b-2 ${
      isActive ? 'border-navy-700 text-navy-800' : 'border-transparent text-gray-500 hover:text-navy-700'
    }`;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
              {project.customerName && (
                <span className="text-xs text-gray-500">고객: {project.customerName}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-navy-800">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <InfoRow label="기간">
            {project.startDate && project.expectedEndDate ? (
              <>
                {formatDateDot(project.startDate)} ~ {formatDateDot(project.expectedEndDate)}
                {weeks && <span className="text-gray-400 ml-1.5">(총 {weeks}주)</span>}
              </>
            ) : (
              <span className="text-gray-400 italic">미입력</span>
            )}
          </InfoRow>
          <InfoRow label="주소">
            {project.siteAddress || <span className="text-gray-400 italic">미입력</span>}
          </InfoRow>
          <InfoRow label="출입번호">
            {project.doorPassword ? (
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded tracking-wider">
                {project.doorPassword}
              </span>
            ) : (
              <span className="text-gray-400 italic">미입력</span>
            )}
          </InfoRow>
          <InfoRow label="연락처">
            {project.customerPhone || <span className="text-gray-400 italic">미입력</span>}
          </InfoRow>
          <InfoRow label="면적">
            {project.area ? `${Number(project.area).toLocaleString('ko-KR')} 평` : <span className="text-gray-400 italic">미입력</span>}
          </InfoRow>
          <InfoRow label="현장정보" full>
            {project.siteNotes ? (
              <span className="whitespace-pre-line">{project.siteNotes}</span>
            ) : (
              <span className="text-gray-400 italic">미입력</span>
            )}
          </InfoRow>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="flex border-b px-2 overflow-x-auto">
          <NavLink to="quotes" className={tab}>견적</NavLink>
          <NavLink to="schedule" className={tab}>공정 일정</NavLink>
          <NavLink to="materials" className={tab}>마감재</NavLink>
          <NavLink to="checklist" className={tab}>체크리스트</NavLink>
          <NavLink to="reports" className={tab}>현장 보고</NavLink>
          <NavLink to="expenses" className={tab}>지출</NavLink>
        </div>
        <div className="p-5">
          <Outlet context={{ project }} />
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

function InfoRow({ label, children, full }) {
  return (
    <div className={`flex gap-3 ${full ? 'md:col-span-2' : ''}`}>
      <span className="text-gray-500 w-16 flex-shrink-0">{label}</span>
      <span className="text-gray-400 flex-shrink-0">|</span>
      <span className="text-gray-800 min-w-0 flex-1">{children}</span>
    </div>
  );
}
