import { Link } from 'react-router-dom';
import { formatDateDot, weeksBetween } from '../utils/date';
import { SIMPLE_QUOTE_STATUS_META, formatWon } from '../api/simpleQuotes';

const STATUS_LABEL = {
  PLANNED: { label: '예정', color: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: '진행중', color: 'bg-sky-100 text-sky-700' },
  ON_HOLD: { label: '보류', color: 'bg-gray-200 text-gray-700' },
  COMPLETED: { label: '완료', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
};

export default function ProjectInfoCard({ project, showHeader = true, actions = null, compact = false, activeQuote = null }) {
  const status = STATUS_LABEL[project.status] || STATUS_LABEL.PLANNED;
  const weeks = weeksBetween(project.startDate, project.expectedEndDate);
  const quoteMeta = activeQuote ? (SIMPLE_QUOTE_STATUS_META[activeQuote.status] || SIMPLE_QUOTE_STATUS_META.DRAFT) : null;

  return (
    <div className={`bg-white rounded-xl border ${compact ? 'p-3 sm:p-4' : 'p-3 sm:p-5'}`}>
      {showHeader && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
              {project.customerName && (
                <span className="text-xs text-gray-500">고객: {project.customerName}</span>
              )}
              {activeQuote && (
                <Link
                  to={`/projects/${project.id}/quotes`}
                  className="text-xs px-2 py-0.5 rounded bg-navy-50 text-navy-700 hover:bg-navy-100 inline-flex items-center gap-1.5"
                  title="견적 탭으로 이동"
                >
                  <span>📄 견적 {activeQuote.title}</span>
                  <span className="tabular-nums font-medium">{formatWon(activeQuote.total)}원</span>
                  <span className={`px-1 rounded text-[10px] ${quoteMeta.color}`}>{quoteMeta.label}</span>
                </Link>
              )}
            </div>
            <h2 className={`font-bold text-navy-800 ${compact ? 'text-lg' : 'text-2xl'}`}>{project.name}</h2>
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      )}

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
