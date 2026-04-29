import { useState } from 'react';
import { categoryClass, fromDateKey } from '../utils/date';
import { useCompanyPhases } from '../hooks/useCompanyPhases';
import VendorPicker from './VendorPicker';
import PhaseInlineContent from './PhaseInlineContent';
import { usePhaseLabels } from '../contexts/PhaseLabelsContext';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 모바일에서 캘린더 셀을 탭했을 때 뜨는 바텀시트.
 * - 자주 쓰는 공종 칩(원탭으로 추가)
 * - 직접 입력
 * - 기존 항목 보기/삭제
 * - 좌우 화살표로 날짜 이동
 */
export default function MobileScheduleSheet({
  dateKey,
  entries,
  onClose,
  onAdd,             // ({content, category}) => void
  onUpdate,          // (id, payload) => Promise   (vendor 태그용)
  onDelete,          // (id) => void
  onToggleConfirm,   // (id) => void
  onNavigate,        // ('prev'|'next') => void
  canPrev,
  canNext,
}) {
  const [content, setContent] = useState('');
  const [vendorMenu, setVendorMenu] = useState(null); // { x, y, entry } | null
  const phases = useCompanyPhases();
  const { displayPhase } = usePhaseLabels();

  const date = fromDateKey(dateKey);
  const dateLabel = `${date.getMonth() + 1}/${date.getDate()} (${DAY_LABELS[date.getDay()]})`;

  function quickAddCategory(cat) {
    onAdd({ content: cat, category: cat });
  }

  function handleAdd() {
    const trimmed = content.trim();
    if (!trimmed) return;
    onAdd({ content: trimmed, category: null });
    setContent('');
  }

  function openVendorMenu(e, entry) {
    const rect = e.currentTarget.getBoundingClientRect();
    setVendorMenu({ x: rect.left, y: rect.bottom + 4, entry });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center px-3 py-3 border-b">
          <button
            onClick={() => onNavigate('prev')}
            disabled={!canPrev}
            className="px-3 py-1 text-navy-700 disabled:text-gray-300"
          >‹</button>
          <div className="flex-1 text-center font-semibold text-navy-800">
            {dateLabel}
          </div>
          <button
            onClick={() => onNavigate('next')}
            disabled={!canNext}
            className="px-3 py-1 text-navy-700 disabled:text-gray-300"
          >›</button>
          <button
            onClick={onClose}
            className="ml-2 px-3 py-1 text-gray-500"
          >✕</button>
        </div>

        {/* 기존 항목 */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {entries.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-3">
              아직 일정이 없습니다
            </div>
          ) : (
            entries.map((e) => (
              <div
                key={e.id}
                className={`flex items-center gap-2 rounded p-2 ${
                  e.confirmed ? 'bg-emerald-50' : 'bg-gray-50'
                }`}
              >
                <button
                  onClick={() => onToggleConfirm(e.id)}
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${
                    e.confirmed
                      ? 'bg-emerald-500 border-emerald-500 text-white text-xs'
                      : 'bg-white border-gray-300'
                  }`}
                >{e.confirmed && '✓'}</button>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-navy-800">
                    <PhaseInlineContent entry={e} alwaysShowRemainder />
                  </div>
                  {e.vendor && (
                    <div className="text-[11px] text-violet-700 mt-0.5">🏢 {e.vendor.name}</div>
                  )}
                </div>
                {onUpdate && (
                  <button
                    onClick={(ev) => openVendorMenu(ev, e)}
                    className="text-gray-400 hover:text-violet-600 px-2 text-base"
                    title="협력업체 태그"
                  >🏢</button>
                )}
                <button
                  onClick={() => onDelete(e.id)}
                  className="text-gray-400 hover:text-rose-500 px-2"
                >✕</button>
              </div>
            ))
          )}
        </div>

        {/* 빠른 공종 칩 */}
        <div className="px-3 py-2 border-t">
          <div className="text-[11px] text-gray-500 mb-1.5">탭 한 번으로 추가</div>
          <div className="grid grid-cols-5 gap-1.5">
            {phases.map((c) => (
              <button
                key={c}
                onClick={() => quickAddCategory(c)}
                className={`text-xs py-2 rounded font-medium ${categoryClass(c)}`}
              >
                {displayPhase(c)}
              </button>
            ))}
          </div>
        </div>

        {/* 직접 입력 */}
        <div className="px-3 py-3 border-t bg-gray-50 flex gap-2 items-center">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="직접 입력 (공종 외)"
            className="flex-1 border rounded px-3 py-2 text-sm"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-navy-700 text-white rounded text-sm font-medium"
          >+</button>
        </div>

        <style>{`
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
          .animate-slide-up { animation: slide-up 0.18s ease-out; }
        `}</style>
      </div>

      {vendorMenu && (
        <VendorPicker
          x={vendorMenu.x}
          y={vendorMenu.y}
          currentVendorId={vendorMenu.entry.vendor?.id || null}
          currentVendorName={vendorMenu.entry.vendor?.name || ''}
          category={vendorMenu.entry.category}
          onSelect={async (vendorId) => {
            const oldId = vendorMenu.entry.vendor?.id || null;
            if (vendorId !== oldId) {
              await onUpdate(vendorMenu.entry.id, { vendorId });
            }
          }}
          onClose={() => setVendorMenu(null)}
        />
      )}
    </div>
  );
}
