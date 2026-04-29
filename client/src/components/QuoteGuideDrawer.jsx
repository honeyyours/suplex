// 견적 작성 시 우측 fixed 드로어 — 활성 라인의 그룹 헤더 공정 자동 추적해서
// 회사 내부 가이드(🔒) + 견적상담 메모(📋)를 inline 편집 가능 카드로 표시.
//
// 등장 방식: WorkContextDrawer(공정상세)와 동일한 fixed right-side 패턴.
// 차이: (1) 폭 더 작음 (320px), (2) 외부 클릭으로 닫히지 않음(작업 중 방해 X),
//       (3) 모바일 미표시(xl 이상에서만), (4) PDF/프린트 비포함(.no-print).
// 작업영역은 padding 안 줌 — 드로어가 그 위에 떠있음 (z-40, 우측 일부 가림 허용).
//
// 편집:
//   - 회사 가이드(tips): SETTINGS_QUOTE_GUIDE 권한 보유자만 편집 (드로어에서 직접 작성)
//   - 견적상담 메모(notes): 회사 멤버 누구나 편집
//   - 800ms debounce 자동 저장
//
// Props:
//   - projectId: 프로젝트 ID
//   - activePhase: 현재 포커스된 라인의 그룹 헤더 공정명, null이면 GENERAL 묶음만 표시
//   - open: 드로어 표시 여부
//   - onClose: ✕ 클릭 시
import { useEffect, useRef, useState } from 'react';
import { phaseNotesApi, GENERAL_PHASE as GENERAL_NOTE, ROLE_LABEL } from '../api/phaseNotes';
import { companyPhaseTipsApi, GENERAL_PHASE as GENERAL_TIP } from '../api/companyPhaseTips';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature, F } from '../utils/features';

export default function QuoteGuideDrawer({ projectId, activePhase, open, onClose }) {
  const { auth } = useAuth();
  const canEditTips = hasFeature(auth, F.SETTINGS_QUOTE_GUIDE);

  const [notes, setNotes] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const [n, t] = await Promise.all([
      phaseNotesApi.list(projectId).catch(() => ({ notes: [] })),
      companyPhaseTipsApi.list().catch(() => ({ tips: [] })),
    ]);
    setNotes(n.notes || []);
    setTips(t.tips || []);
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    reload().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    /* eslint-disable-next-line */
  }, [projectId, open]);

  if (!open) return null;

  const generalNote = notes.find((n) => n.phase === GENERAL_NOTE);
  const phaseNote = activePhase ? notes.find((n) => n.phase === activePhase) : null;
  const generalTip = tips.find((t) => t.phase === GENERAL_TIP);
  const phaseTip = activePhase ? tips.find((t) => t.phase === activePhase) : null;

  return (
    <aside
      className="no-print hidden xl:flex fixed top-0 right-0 bottom-0 w-[320px] bg-white shadow-2xl z-40 flex-col border-l"
    >
      {/* 헤더 */}
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">견적 가이드</div>
          <div className="text-sm font-semibold text-navy-800 truncate">
            {activePhase || <span className="text-gray-400 font-normal">전체 공통</span>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-2 py-1 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded flex-shrink-0"
          title="가이드 닫기 (헤더의 📖 가이드 버튼으로 다시 열 수 있습니다)"
        >✕</button>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {loading ? (
          <div className="text-xs text-gray-400 py-6 text-center">불러오는 중…</div>
        ) : (
          <>
            {/* 활성 공정 묶음 — 활성 공정 있을 때 상단 (현재 작업 컨텍스트가 가장 중요) */}
            {activePhase && (
              <PhaseGroup
                title={`🔧 ${activePhase}`}
                accent="navy"
                tipBody={phaseTip?.body}
                tipUpdatedBy={phaseTip?.updatedBy}
                noteBody={phaseNote?.body}
                noteUpdatedBy={phaseNote?.updatedBy}
                noteUpdatedAt={phaseNote?.updatedAt}
                canEditTips={canEditTips}
                onSaveTip={async (body) => {
                  await companyPhaseTipsApi.upsert(activePhase, body);
                  await reload();
                }}
                onSaveNote={async (body) => {
                  await phaseNotesApi.upsert(projectId, activePhase, body);
                  await reload();
                }}
              />
            )}

            {/* GENERAL 묶음 — 항상 노출. 활성 공정 있으면 그 아래로 */}
            <PhaseGroup
              title="🌐 전체 공통"
              accent="amber"
              tipBody={generalTip?.body}
              tipUpdatedBy={generalTip?.updatedBy}
              noteBody={generalNote?.body}
              noteUpdatedBy={generalNote?.updatedBy}
              noteUpdatedAt={generalNote?.updatedAt}
              canEditTips={canEditTips}
              onSaveTip={async (body) => {
                await companyPhaseTipsApi.upsert(GENERAL_TIP, body);
                await reload();
              }}
              onSaveNote={async (body) => {
                await phaseNotesApi.upsert(projectId, GENERAL_NOTE, body);
                await reload();
              }}
            />

            {!activePhase && (
              <div className="text-[11px] text-gray-400 text-center pt-2 leading-relaxed">
                견적 행을 클릭하면<br/>그 공정의 가이드가 자동으로 표시됩니다.
              </div>
            )}
          </>
        )}
      </div>

      {/* 푸터 */}
      <div className="px-3 py-2 border-t bg-gray-50 text-[10px] text-gray-400 leading-relaxed">
        ⚠️ 회사 가이드는 <b>화면 전용</b>입니다. 견적 PDF에는 표시되지 않습니다.
      </div>
    </aside>
  );
}

// 한 묶음(GENERAL 또는 활성 공정) — 회사 가이드 + 견적상담 카드 둘
function PhaseGroup({
  title, accent,
  tipBody, tipUpdatedBy,
  noteBody, noteUpdatedBy, noteUpdatedAt,
  canEditTips, onSaveTip, onSaveNote,
}) {
  const accentClass = accent === 'navy' ? 'text-navy-700' : 'text-amber-700';
  return (
    <div className="space-y-2">
      <div className={`text-[10px] font-semibold tracking-wider ${accentClass}`}>{title}</div>
      <EditableCard
        kind="tip"
        body={tipBody}
        updatedBy={tipUpdatedBy}
        canEdit={canEditTips}
        onSave={onSaveTip}
      />
      <EditableCard
        kind="note"
        body={noteBody}
        updatedBy={noteUpdatedBy}
        updatedAt={noteUpdatedAt}
        canEdit={true}
        onSave={onSaveNote}
      />
    </div>
  );
}

// 인라인 편집 카드 — 800ms debounce 자동 저장. 비었으면 placeholder.
function EditableCard({ kind, body, updatedBy, updatedAt, canEdit, onSave }) {
  const isTip = kind === 'tip';
  const cls = isTip
    ? 'bg-amber-50 border-amber-200'
    : 'bg-sky-50 border-sky-200';
  const labelCls = isTip ? 'text-amber-800' : 'text-sky-800';
  const stampCls = isTip ? 'text-amber-700/70' : 'text-sky-700/70';
  const label = isTip ? '🔒 회사 내부 가이드' : '📋 견적상담 메모';
  const placeholder = isTip
    ? (canEdit
        ? '회사 단가, 자주 빠지는 항목 등 내부 메모…'
        : '아직 작성된 회사 가이드가 없습니다 (편집 권한 필요)')
    : '클라이언트 의견, 추가 요청사항 등…';

  const [draft, setDraft] = useState(body || '');
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);

  // 외부 데이터 변경 시 동기화 (편집 중이 아닐 때만)
  useEffect(() => {
    if (!timerRef.current) setDraft(body || '');
    /* eslint-disable-next-line */
  }, [body]);

  function scheduleSave(value) {
    setDraft(value);
    if (!canEdit) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      timerRef.current = null;
      setSaving(true);
      try {
        await onSave(value);
      } catch (e) {
        alert('저장 실패: ' + (e.response?.data?.error || e.message));
      } finally {
        setSaving(false);
      }
    }, 800);
  }

  return (
    <div className={`border rounded p-2.5 text-xs ${cls}`}>
      <div className={`flex items-center justify-between gap-2 mb-1 text-[10px] font-medium ${labelCls}`}>
        <span>{label}</span>
        {saving && <span className="text-gray-400 font-normal">저장 중…</span>}
      </div>
      <textarea
        value={draft}
        onChange={(e) => scheduleSave(e.target.value)}
        disabled={!canEdit}
        rows={Math.min(6, Math.max(2, (draft || '').split('\n').length))}
        placeholder={placeholder}
        className="w-full bg-transparent text-gray-800 text-xs leading-relaxed outline-none resize-none disabled:text-gray-500 placeholder:text-gray-400"
      />
      {updatedBy && (
        <div className={`text-[10px] mt-1 ${stampCls}`}>
          — {updatedBy.name}{updatedBy.role ? ` (${ROLE_LABEL[updatedBy.role] || updatedBy.role})` : ''}
          {updatedAt && ` · ${new Date(updatedAt).toLocaleDateString('ko-KR')}`}
        </div>
      )}
    </div>
  );
}
