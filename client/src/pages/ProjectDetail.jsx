import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import EditProjectModal from '../components/EditProjectModal';
import ProjectInfoCard from '../components/ProjectInfoCard';
import ProjectActionsMenu from '../components/ProjectActionsMenu';
import ExtractModal from '../components/ExtractModal';
import ChangesModal from '../components/ChangesModal';
import { backupApi, downloadJson } from '../api/backup';
import { simpleQuotesApi } from '../api/simpleQuotes';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const hideExpenses = !!auth?.company?.hideExpenses;
  const [project, setProject] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);
  const [showExtract, setShowExtract] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [activeQuote, setActiveQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

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

  // 백업 export/import — 일정 탭 햄버거에서 직접 호출
  async function handleExport() {
    setBusy(true);
    try {
      const data = await backupApi.exportProject(id);
      const safe = (project?.name || 'suplex').replace(/[^\w가-힣]+/g, '_');
      const date = new Date().toISOString().slice(0, 10);
      downloadJson(data, `suplex_${safe}_${date}.json`);
    } catch (e) {
      alert('백업 실패: ' + (e.response?.data?.error || e.message));
    } finally { setBusy(false); }
  }
  function triggerImport() { fileRef.current?.click(); }
  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const text = await file.text();
    let parsed;
    try { parsed = JSON.parse(text); }
    catch { alert('JSON 파싱 실패'); return; }
    if (!parsed.version) { alert('올바른 Suplex 백업 파일이 아닙니다'); return; }
    const confirmMsg = parsed.type === 'company'
      ? `회사 전체 백업입니다. ${parsed.company?.projects?.length || 0}개 프로젝트를 새로 만듭니다. 진행할까요?`
      : `프로젝트 "${parsed.project?.name}"을(를) 새 프로젝트로 복원합니다. 진행할까요?`;
    if (!confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await backupApi.import({ data: parsed, mode: 'new' });
      alert(`✅ 복원 완료: ${res.projects.length}개 프로젝트`);
      if (res.projects[0]) navigate(`/projects/${res.projects[0].id}`);
    } catch (e) {
      alert('복원 실패: ' + (e.response?.data?.error || e.message));
    } finally { setBusy(false); }
  }

  if (err) return <div className="bg-white rounded-xl border p-8 text-rose-600">{err}</div>;
  if (!project) return <div className="text-sm text-gray-500">불러오는 중...</div>;

  const tab = ({ isActive }) =>
    `px-3 sm:px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 transition ${
      isActive
        ? 'border-navy-700 text-navy-800'
        : 'border-transparent text-gray-500 hover:text-navy-700 hover:border-gray-300'
    }`;

  // 모든 탭에서 동일한 햄버거 메뉴 5개 항목 — 일관된 UX
  const menuItems = [
    { icon: '✏️', label: '수정', onClick: () => setEditing(true) },
    { icon: '📝', label: '변동 로그', onClick: () => setShowChanges(true) },
    { icon: '📋', label: '일정 복사', onClick: () => setShowExtract(true) },
    { divider: true },
    { icon: '💾', label: 'JSON 내보내기', onClick: handleExport },
    { icon: '📥', label: 'JSON 복원', onClick: triggerImport },
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
        <div className="flex border-b px-2 overflow-x-auto">
          <NavLink to="process" className={tab}>공정 현황</NavLink>
          <NavLink to="quote-consultations" className={tab}>견적상담</NavLink>
          <NavLink to="quotes" className={tab}>견적</NavLink>
          <NavLink to="schedule" className={tab}>공정 일정</NavLink>
          <NavLink to="materials" className={tab}>마감재</NavLink>
          <NavLink to="orders" className={tab}>발주</NavLink>
          <NavLink to="checklist" className={tab}>체크리스트</NavLink>
          <NavLink to="reports" className={tab}>현장 보고</NavLink>
          {!hideExpenses && <NavLink to="expenses" className={tab}>지출</NavLink>}
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

      {/* 일정 탭 모달 — 햄버거 메뉴에서 트리거 */}
      {showExtract && <ExtractModal projectId={id} project={project} onClose={() => setShowExtract(false)} />}
      {showChanges && <ChangesModal projectId={id} onClose={() => setShowChanges(false)} />}

      {/* 일정 탭 백업 import용 hidden input */}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFile}
        className="hidden"
      />
      {busy && <div className="fixed top-4 right-4 z-50 bg-navy-700 text-white text-sm px-3 py-1.5 rounded shadow">처리 중...</div>}
    </div>
  );
}
