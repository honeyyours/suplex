// 견적 작성 시 우측 fixed 드로어 — 활성 라인의 그룹 헤더 공정 자동 추적해서
// 회사 내부 가이드(🔒) + 견적상담 메모(📋)를 inline 편집 가능 카드로 표시.
//
// 등장 방식: WorkContextDrawer(공정상세)와 동일한 fixed right-side 패턴.
// - 폭 사용자가 좌측 가장자리 drag로 조절 (280~720px, localStorage에 저장).
// - 외부 클릭으로 닫히지 않음(작업 중 방해 X).
// - 모바일 미표시(xl 이상에서만).
// - PDF/프린트 비포함(.no-print).
// - 작업영역 padding 안 줌 — 드로어가 위에 떠있음 (z-40, 우측 일부 가림 허용).
//
// 편집:
//   - 회사 가이드(tips): SETTINGS_QUOTE_GUIDE 권한 보유자만 편집
//   - 견적상담 메모(notes): 회사 멤버 누구나 편집
//   - 800ms debounce 자동 저장
import { useEffect, useRef, useState } from 'react';
import { phaseNotesApi, GENERAL_PHASE as GENERAL_NOTE, ROLE_LABEL } from '../api/phaseNotes';
import { companyPhaseTipsApi, GENERAL_PHASE as GENERAL_TIP } from '../api/companyPhaseTips';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature, F } from '../utils/features';

const WIDTH_KEY = 'quoteGuideDrawerWidth';
const MIN_WIDTH = 280;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 320;

export default function QuoteGuideDrawer({ projectId, activePhase, open, onClose }) {
  const { auth } = useAuth();
  const canEditTips = hasFeature(auth, F.SETTINGS_QUOTE_GUIDE);

  const [notes, setNotes] = useState([]);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);

  // 사용자 조절 가능한 폭 (localStorage에 저장)
  const [width, setWidth] = useState(() => {
    const saved = parseInt(localStorage.getItem(WIDTH_KEY) || '', 10);
    if (Number.isFinite(saved)) return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, saved));
    return DEFAULT_WIDTH;
  });
  const widthRef = useRef(width);
  widthRef.current = width;

  function startResize(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widthRef.current;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    function onMove(ev) {
      // 드로어가 우측에 붙어있으니 startX보다 왼쪽으로 갈수록 폭 증가
      const newW = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW + (startX - ev.clientX)));
      setWidth(newW);
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      localStorage.setItem(WIDTH_KEY, String(widthRef.current));
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

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
      style={{ width: `${width}px` }}
      className="no-print hidden xl:flex fixed top-0 right-0 bottom-0 bg-white shadow-2xl z-40 flex-col border-l"
    >
      {/* Resize 핸들 — 좌측 가장자리 4px 영역 */}
      <div
        onMouseDown={startResize}
        title="드래그하여 폭 조절"
        className="absolute top-0 left-0 bottom-0 w-1 cursor-col-resize hover:bg-navy-300 active:bg-navy-500 transition-colors z-10"
      />

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
            {/* 활성 공정 묶음 — 활성 공정 있을 때 상단 */}
            {activePhase && (
              <PhaseGroup
                key={`phase-${activePhase}`}
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

            {/* GENERAL 묶음 — 항상 노출 */}
            <PhaseGroup
              key="phase-general"
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
