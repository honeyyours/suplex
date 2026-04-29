// 견적 작성 화면 우측 sticky 드로어 — 작성 중인 공정의 견적상담 메모 + 회사 내부 가이드 표시.
// 화면 전용 (PDF/프린트에는 안 나감 — .no-print + 구조적으로 PrintModal 바깥에 위치).
//
// Props:
//   - projectId: 프로젝트 ID
//   - activePhase: 현재 포커스된 라인의 그룹 헤더 공정명(normalize된 표준 라벨), null이면 자동 추적 X
//   - onClose: 사용자가 ✕로 닫을 때
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { phaseNotesApi, GENERAL_PHASE as GENERAL_NOTE, ROLE_LABEL } from '../api/phaseNotes';
import { companyPhaseTipsApi, GENERAL_PHASE as GENERAL_TIP } from '../api/companyPhaseTips';

export default function QuoteGuideDrawer({ projectId, activePhase, onClose }) {
  const [notes, setNotes] = useState([]); // 견적상담 (프로젝트별)
  const [tips, setTips] = useState([]);   // 회사 메모
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [projectId]);

  // GENERAL과 활성 공정 메모/팁 추출
  const generalNote = notes.find((n) => n.phase === GENERAL_NOTE);
  const phaseNote = activePhase ? notes.find((n) => n.phase === activePhase) : null;
  const generalTip = tips.find((t) => t.phase === GENERAL_TIP);
  const phaseTip = activePhase ? tips.find((t) => t.phase === activePhase) : null;

  const hasAny = generalNote || phaseNote || generalTip || phaseTip;

  return (
    <aside className="no-print bg-white border rounded-xl p-3 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto text-sm space-y-3">
      <div className="flex items-center justify-between gap-2 sticky top-0 bg-white pb-2 border-b">
        <div className="min-w-0">
          <div className="text-[11px] text-gray-400">견적 가이드</div>
          <div className="font-semibold text-navy-800 truncate">
            {activePhase || '공정 미선택'}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded"
          title="드로어 닫기"
        >✕</button>
      </div>

      {loading ? (
        <div className="text-xs text-gray-400 py-4 text-center">불러오는 중…</div>
      ) : !hasAny ? (
        <div className="text-xs text-gray-400 py-6 text-center leading-relaxed">
          <div>
            {activePhase
              ? <>이 공정에 대한 가이드가 없습니다.</>
              : <>견적 행을 클릭하면 그 공정의 가이드가 자동으로 표시됩니다.</>}
          </div>
          <Link
            to={`/projects/${projectId}/quote-consultations`}
            className="inline-block mt-3 text-navy-700 hover:underline"
          >
            견적상담 탭에서 메모 추가하기 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* GENERAL 묶음 — 항상 상단 */}
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
        </div>
      )}

      <div className="pt-2 border-t text-[10px] text-gray-400 leading-relaxed">
        ⚠️ 회사 내부 가이드는 <b>화면 전용</b>입니다. 견적서 PDF에는 표시되지 않습니다.
      </div>
    </aside>
  );
}

// 회사 내부 메모 카드 (자물쇠 강조)
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

// 견적상담 메모 카드
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
