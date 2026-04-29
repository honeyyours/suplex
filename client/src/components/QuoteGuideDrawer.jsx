// 견적 작성 시 우측 fixed 드로어 — 활성 라인의 그룹 헤더 공정 자동 추적해서
// 회사 내부 가이드(🔒) + 견적상담 메모(📋)를 묶음 표시.
//
// 등장 방식: WorkContextDrawer(공정상세)와 동일한 fixed right-side 패턴.
// 차이: (1) 폭 더 작음 (320px), (2) 외부 클릭으로 닫히지 않음(작업 중 방해 X),
//       (3) 모바일 미표시(xl 이상에서만), (4) PDF/프린트 비포함(.no-print).
// 작업영역은 호출하는 부모(ProjectSimpleQuotes)에서 xl:pr-[340px]로 자리 비워줌.
//
// Props:
//   - projectId: 프로젝트 ID
//   - activePhase: 현재 포커스된 라인의 그룹 헤더 공정명(normalize된 표준 라벨), null이면 "미선택"
//   - open: 드로어 표시 여부 (false면 렌더 X)
//   - onClose: ✕ 클릭 시
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { phaseNotesApi, GENERAL_PHASE as GENERAL_NOTE, ROLE_LABEL } from '../api/phaseNotes';
import { companyPhaseTipsApi, GENERAL_PHASE as GENERAL_TIP } from '../api/companyPhaseTips';

export default function QuoteGuideDrawer({ projectId, activePhase, open, onClose }) {
  const [notes, setNotes] = useState([]); // 견적상담 (프로젝트별)
  const [tips, setTips] = useState([]);   // 회사 메모
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      phaseNotesApi.list(projectId).catch(() => ({ notes: [] })),
      companyPhaseTipsApi.list().catch(() => ({ tips: [] })),
    ]).then(([n, t]) => {
      if (cancelled) return;
      setNotes(n.notes || []);
      setTips(t.tips || []);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId, open]);

  if (!open) return null;

  const generalNote = notes.find((n) => n.phase === GENERAL_NOTE);
  const phaseNote = activePhase ? notes.find((n) => n.phase === activePhase) : null;
  const generalTip = tips.find((t) => t.phase === GENERAL_TIP);
  const phaseTip = activePhase ? tips.find((t) => t.phase === activePhase) : null;

  const hasAny = generalNote || phaseNote || generalTip || phaseTip;

  return (
    <aside
      className="no-print hidden xl:flex fixed top-0 right-0 bottom-0 w-[320px] bg-white shadow-2xl z-40 flex-col border-l"
    >
      {/* 헤더 — sticky 상단 */}
      <div className="px-4 py-3 border-b bg-white sticky top-0 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">견적 가이드</div>
          <div className="text-sm font-semibold text-navy-800 truncate">
            {activePhase || <span className="text-gray-400 font-normal">공정 미선택</span>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded flex-shrink-0"
          title="가이드 닫기 (헤더의 📖 가이드 버튼으로 다시 열 수 있습니다)"
        >✕</button>
      </div>

      {/* 본문 — 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto p-3 text-sm space-y-3">
        {loading ? (
          <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>
        ) : !hasAny ? (
          <div className="text-xs text-gray-400 py-8 text-center leading-relaxed">
            <div>
              {activePhase
                ? <>이 공정에 대한 가이드가 없습니다.</>
                : <>견적 행을 클릭하면<br/>그 공정의 가이드가 자동으로 표시됩니다.</>}
            </div>
            <Link
              to={`/projects/${projectId}/quote-consultations`}
              className="inline-block mt-3 text-navy-700 hover:underline"
            >
              견적상담 탭에서 메모 추가하기 →
            </Link>
          </div>
        ) : (
          <>
            {/* GENERAL — 항상 상단 */}
            {(generalTip || generalNote) && (
              <div className="space-y-2">
                <div className="text-[10px] text-amber-700 font-semibold tracking-wider">🌐 전체 공통</div>
                {generalTip && <TipCard body={generalTip.body} updatedBy={generalTip.updatedBy} />}
                {generalNote && (
                  <NoteCard
                    body={generalNote.body}
                    updatedBy={generalNote.updatedBy}
                    updatedAt={generalNote.updatedAt}
                  />
                )}
              </div>
            )}

            {/* 활성 공정 묶음 */}
            {activePhase && (phaseTip || phaseNote) && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-[10px] text-navy-700 font-semibold tracking-wider">
                  🔧 {activePhase}
                </div>
                {phaseTip && <TipCard body={phaseTip.body} updatedBy={phaseTip.updatedBy} />}
                {phaseNote && (
                  <NoteCard
                    body={phaseNote.body}
                    updatedBy={phaseNote.updatedBy}
                    updatedAt={phaseNote.updatedAt}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* 푸터 — 화면 전용 안내 */}
      <div className="px-3 py-2 border-t bg-gray-50 text-[10px] text-gray-400 leading-relaxed">
        ⚠️ 회사 가이드는 <b>화면 전용</b>입니다. 견적 PDF에는 표시되지 않습니다.
      </div>
    </aside>
  );
}

function TipCard({ body, updatedBy }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-xs">
      <div className="flex items-center gap-1 text-[10px] text-amber-800 font-medium mb-1">
        🔒 회사 내부 가이드
      </div>
      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{body?.trim() || '—'}</div>
      {updatedBy && (
        <div className="text-[10px] text-amber-700/70 mt-1.5">
          — {updatedBy.name}{updatedBy.role ? ` (${ROLE_LABEL[updatedBy.role] || updatedBy.role})` : ''}
        </div>
      )}
    </div>
  );
}

function NoteCard({ body, updatedBy, updatedAt }) {
  return (
    <div className="bg-sky-50 border border-sky-200 rounded p-2.5 text-xs">
      <div className="flex items-center gap-1 text-[10px] text-sky-800 font-medium mb-1">
        📋 견적상담 메모
      </div>
      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">{body?.trim() || '—'}</div>
      {updatedBy && (
        <div className="text-[10px] text-sky-700/70 mt-1.5">
          — {updatedBy.name}{updatedBy.role ? ` (${ROLE_LABEL[updatedBy.role] || updatedBy.role})` : ''} · {new Date(updatedAt).toLocaleDateString('ko-KR')}
        </div>
      )}
    </div>
  );
}
