import { useEffect, useMemo, useState } from 'react';
import { STANDARD_PHASES } from '../utils/phases';
import { usePhaseLabels } from '../contexts/PhaseLabelsContext';
import { phaseNotesApi, GENERAL_PHASE } from '../api/phaseNotes';
import { useEscape } from '../hooks/useEscape';

// 새 간편 견적 생성 모달.
// 표준 공종(척추)을 체크 → 클릭 순서대로 견적 그룹으로 만들어 생성.
// '기타'는 자유 텍스트 그룹용이라 여기서 노출 X (필요 시 빈 견적에서 직접 그룹 추가).
// projectId 받으면 견적상담에서 메모 있는 공정을 자동 사전체크 (STANDARD_PHASES 정렬 순).
const SELECTABLE_PHASES = STANDARD_PHASES.filter((p) => p.key !== 'OTHER');

export default function NewQuoteWithPhasesModal({ projectId, onClose, onCreate }) {
  useEscape(true, onClose);
  const { displayPhase } = usePhaseLabels();
  // 클릭 순서 보존이 핵심 — Set 대신 배열로 phase.label을 순서대로 쌓는다.
  const [selectedLabels, setSelectedLabels] = useState([]);
  const [busy, setBusy] = useState(false);
  const [prefillCount, setPrefillCount] = useState(0); // 견적상담에서 자동 사전체크된 개수
  // 노션식 드래그 상태 — fromIdx, dragOver = { idx, pos: 'before' | 'after' }
  const [dragFromIdx, setDragFromIdx] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  // 견적상담 메모 있는 공정 자동 사전체크 — 표준 공종 순서대로
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    phaseNotesApi.list(projectId).then(({ notes }) => {
      if (cancelled) return;
      const phaseSet = new Set(
        (notes || []).filter((n) => n.phase !== GENERAL_PHASE).map((n) => n.phase)
      );
      if (phaseSet.size === 0) return;
      // 표준 공종 정의 순서대로 정렬해서 사전체크 (사용자가 우측에서 드래그로 재정렬 가능)
      const ordered = SELECTABLE_PHASES.filter((p) => phaseSet.has(p.label)).map((p) => p.label);
      setSelectedLabels(ordered);
      setPrefillCount(ordered.length);
    }).catch(() => { /* 견적상담 비어있어도 무시 */ });
    return () => { cancelled = true; };
  }, [projectId]);

  const selectedSet = useMemo(() => new Set(selectedLabels), [selectedLabels]);

  function toggle(label) {
    setSelectedLabels((prev) => {
      const idx = prev.indexOf(label);
      if (idx >= 0) return prev.filter((l) => l !== label);
      return [...prev, label];
    });
  }

  function remove(idx) {
    setSelectedLabels((prev) => prev.filter((_, i) => i !== idx));
  }

  // 드롭 위치(toIdx, before/after 합산)가 사실상 제자리면 no-op
  function reorder(fromIdx, idx, pos) {
    const toIdx = pos === 'after' ? idx + 1 : idx;
    if (fromIdx === toIdx || fromIdx === toIdx - 1) return;
    setSelectedLabels((prev) => {
      if (fromIdx < 0 || fromIdx >= prev.length) return prev;
      const moving = prev[fromIdx];
      const next = [...prev];
      next.splice(fromIdx, 1);
      const adjustedTo = toIdx > fromIdx ? toIdx - 1 : toIdx;
      next.splice(adjustedTo, 0, moving);
      return next;
    });
  }

  async function submit(withPhases) {
    if (busy) return;
    setBusy(true);
    try {
      await onCreate(withPhases ? selectedLabels : []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <div>
            <div className="font-bold text-navy-800">새 견적 — 공종 선택</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              체크한 순서대로 견적서에 그룹으로 들어갑니다. 우측에서 순서를 바꾸거나 빼낼 수 있습니다.
              {prefillCount > 0 && (
                <span className="ml-2 text-emerald-700">
                  · 💡 견적상담의 {prefillCount}개 공종이 자동 선택되었습니다
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-4 p-4 overflow-y-auto flex-1">
          {/* 좌측 — 표준 공종 체크박스 */}
          <div>
            <div className="text-xs text-gray-500 mb-2">표준 공종 ({SELECTABLE_PHASES.length}개)</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {SELECTABLE_PHASES.map((p) => {
                const checked = selectedSet.has(p.label);
                const order = checked ? selectedLabels.indexOf(p.label) + 1 : null;
                return (
                  <button
                    key={p.key}
                    onClick={() => toggle(p.label)}
                    className={`text-left text-sm px-2.5 py-1.5 rounded border transition flex items-center gap-2 ${
                      checked
                        ? 'border-navy-700 bg-navy-50 text-navy-800'
                        : 'border-gray-200 hover:border-navy-400 hover:bg-gray-50'
                    }`}
                    title={p.hint || ''}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold flex-shrink-0 ${
                        checked ? 'bg-navy-700 text-white' : 'border border-gray-300 text-transparent'
                      }`}
                    >
                      {order || '·'}
                    </span>
                    <span className="truncate">{displayPhase(p.label)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 우측 — 선택 미리보기 (순서 = 견적 순서) */}
          <div className="md:border-l md:pl-4">
            <div className="text-xs text-gray-500 mb-2">
              견적 순서 ({selectedLabels.length})
            </div>
            {selectedLabels.length === 0 ? (
              <div className="text-xs text-gray-400 py-6 text-center border border-dashed rounded">
                좌측에서 공종을 체크하세요.<br />
                체크한 순서대로 들어갑니다.
              </div>
            ) : (
              <div className="space-y-1">
                {selectedLabels.map((label, i) => {
                  const isDragging = dragFromIdx === i;
                  const showBefore = dragOver?.idx === i && dragOver.pos === 'before';
                  const showAfter = dragOver?.idx === i && dragOver.pos === 'after';
                  return (
                    <div
                      key={label}
                      className={`group relative flex items-center gap-1 pl-1 pr-2 py-1 border border-navy-200 bg-navy-50/40 rounded text-sm transition-opacity ${
                        isDragging ? 'opacity-30' : ''
                      }`}
                      onDragOver={(e) => {
                        if (dragFromIdx == null) return;
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
                        // 제자리 드롭이면 indicator 숨김
                        const toIdx = pos === 'after' ? i + 1 : i;
                        if (toIdx === dragFromIdx || toIdx === dragFromIdx + 1) {
                          setDragOver(null);
                          return;
                        }
                        setDragOver({ idx: i, pos });
                      }}
                      onDragLeave={(e) => {
                        // 같은 행 내부 자식으로 이동한 경우는 무시
                        if (e.currentTarget.contains(e.relatedTarget)) return;
                        setDragOver((d) => (d?.idx === i ? null : d));
                      }}
                      onDrop={(e) => {
                        if (dragFromIdx == null) return;
                        e.preventDefault();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
                        reorder(dragFromIdx, i, pos);
                        setDragFromIdx(null);
                        setDragOver(null);
                      }}
                    >
                      {showBefore && (
                        <span className="pointer-events-none absolute -top-0.5 left-0 right-0 h-0.5 bg-navy-500 rounded" />
                      )}
                      {showAfter && (
                        <span className="pointer-events-none absolute -bottom-0.5 left-0 right-0 h-0.5 bg-navy-500 rounded" />
                      )}
                      <div
                        draggable={true}
                        onDragStart={(e) => {
                          setDragFromIdx(i);
                          // FF 호환 — 드래그 데이터가 없으면 일부 브라우저에서 dragstart 무시
                          try { e.dataTransfer.setData('text/plain', String(i)); } catch {}
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => { setDragFromIdx(null); setDragOver(null); }}
                        title="드래그해서 순서 변경"
                        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-navy-700 select-none px-0.5 leading-none text-[12px] sm:opacity-40 sm:group-hover:opacity-100 transition-opacity"
                        style={{ touchAction: 'none' }}
                      >
                        ⠿
                      </div>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-navy-700 text-white text-[11px] font-bold flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="flex-1 truncate text-navy-800">{displayPhase(label)}</span>
                      <button
                        onClick={() => remove(i)}
                        className="text-xs text-gray-400 hover:text-rose-600 px-1"
                        title="제거"
                      >✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="border-t px-5 py-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="text-[11px] text-gray-400">
            나중에 견적 안에서 그룹을 직접 추가하거나 자유 텍스트 그룹(예: "1층 화장실")을 만들 수도 있습니다.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => submit(false)}
              disabled={busy}
              className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-60"
            >
              건너뛰기 (빈 견적)
            </button>
            <button
              onClick={() => submit(true)}
              disabled={busy || selectedLabels.length === 0}
              className="text-sm px-4 py-1.5 bg-navy-700 text-white rounded hover:bg-navy-800 disabled:opacity-60"
            >
              {busy ? '생성 중…' : `${selectedLabels.length}개 공종으로 생성`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
