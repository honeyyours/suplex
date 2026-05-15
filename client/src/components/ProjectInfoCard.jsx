import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDateDot, weeksBetween } from '../utils/date';
import { SIMPLE_QUOTE_STATUS_META, formatWon } from '../api/simpleQuotes';
import ProjectMembersModal from './ProjectMembersModal';

const STATUS_LABEL = {
  PLANNED: { label: '예정', color: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: '진행중', color: 'bg-sky-100 text-sky-700' },
  ON_HOLD: { label: '보류', color: 'bg-gray-200 text-gray-700' },
  COMPLETED: { label: '완료', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: '취소', color: 'bg-rose-100 text-rose-700' },
};

export default function ProjectInfoCard({ project, showHeader = true, actions = null, compact = false, activeQuote = null }) {
  const status = STATUS_LABEL[project.status] || STATUS_LABEL.PLANNED;
  const weeks = weeksBetween(project.startDate, project.expectedEndDate);
  const quoteMeta = activeQuote ? (SIMPLE_QUOTE_STATUS_META[activeQuote.status] || SIMPLE_QUOTE_STATUS_META.DRAFT) : null;
  const [showMembers, setShowMembers] = useState(false);

  return (
    <div className={`bg-white rounded-xl border ${compact ? 'p-3 sm:p-4' : 'p-3 sm:p-5'}`}>
      {showHeader && (
        <div className="mb-4">
          {/* 1행: 상태 chip + 액션 */}
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
              {project.customerName && (
                <span className="text-xs text-gray-500">고객: {project.customerName}</span>
              )}
              {project.photosArchivedAt && (
                <span
                  className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600"
                  title={`사진 외부 보관: ${new Date(project.photosArchivedAt).toLocaleString('ko-KR')}`}
                >
                  📦 사진 외부 보관 · {new Date(project.photosArchivedAt).toISOString().slice(0, 10)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowMembers(true)}
                className="text-xs px-2.5 py-1 border border-gray-200 rounded hover:bg-gray-50 whitespace-nowrap text-gray-700"
                title="팀 관리"
              >
                👥 팀
              </button>
              {actions}
            </div>
          </div>
          {/* 2행: 제목 — 모바일 작게, 데스크탑 크게 */}
          <h2 className={`font-bold text-navy-800 leading-tight break-keep ${compact ? 'text-base sm:text-lg' : 'text-lg sm:text-2xl'}`}>
            {project.name}
          </h2>
          {/* 3행: 견적 활성 카드 — 클릭 시 견적 탭 이동 */}
          {activeQuote && (
            <Link
              to={`/projects/${project.id}/quotes`}
              className="mt-3 flex items-center justify-between gap-3 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
              title="견적 탭으로 이동"
            >
              <div className="min-w-0">
                <div className="text-[11px] text-gray-500 mb-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>견적 {activeQuote.title}</span>
                  <span className={`px-1 rounded text-[10px] ${quoteMeta.color}`}>{quoteMeta.label}</span>
                </div>
                <div className="text-base sm:text-lg font-semibold text-navy-800 tabular-nums">
                  {formatWon(activeQuote.total)}원
                </div>
              </div>
              <span className="text-gray-400 text-lg flex-shrink-0">›</span>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        <InfoRow label="기간">
          {project.startDate && project.expectedEndDate ? (
            <>
              {formatDateDot(project.startDate)} ~ {formatDateDot(project.expectedEndDate)}
              {weeks && <span className="text-gray-400 ml-1.5">(총 {weeks}주)</span>}
            </>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </InfoRow>
        <InfoRow label="주소">
          {project.siteAddress || <span className="text-gray-300">—</span>}
        </InfoRow>
        <InfoRow label="연락처">
          {project.customerPhone || <span className="text-gray-300">—</span>}
        </InfoRow>
        <InfoRow label="면적">
          {project.area ? `${Number(project.area).toLocaleString('ko-KR')} 평` : <span className="text-gray-300">—</span>}
        </InfoRow>
        <InfoRow label="출입번호">
          {project.doorPassword ? (
            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded tracking-wider">
              {project.doorPassword}
            </span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </InfoRow>
        <InfoRow label="현장정보" full>
          {project.siteNotes ? (
            <span className="whitespace-pre-line">{project.siteNotes}</span>
          ) : (
            <span className="text-gray-300">—</span>
          )}
        </InfoRow>
        {!showHeader && (
          <InfoRow label="팀" full>
            <button onClick={() => setShowMembers(true)} className="text-navy-700 hover:underline text-sm">
              👥 팀 관리 →
            </button>
          </InfoRow>
        )}
      </div>
      {showMembers && <ProjectMembersModal projectId={project.id} onClose={() => setShowMembers(false)} />}
    </div>
  );
}

function InfoRow({ label, children, full }) {
  return (
    <div className={`flex items-start gap-3 ${full ? 'md:col-span-2' : ''}`}>
      <span className="text-xs text-gray-500 w-16 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-gray-800 min-w-0 flex-1">{children}</span>
    </div>
  );
}
