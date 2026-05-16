import { useState, useRef } from 'react';
import { categoryDotClass, fromDateKey } from '../utils/date';
import { useCompanyPhases } from '../hooks/useCompanyPhases';
import VendorPicker from './VendorPicker';
import PhaseInlineContent from './PhaseInlineContent';
import { usePhaseLabels } from '../contexts/PhaseLabelsContext';
import { useEscape } from '../hooks/useEscape';

const DAY_LABELS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
// 협력업체 태그 등록 UI 일시 하이드 (2026-05-15) — 다시 노출하려면 true로
const SHOW_VENDOR_REGISTRATION = false;

// 인라인 SVG 아이콘 — heroicons 스타일 (24x24, currentColor, 1.75 stroke)
function IconChevronLeft({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
  );
}
function IconChevronRight({ className = '' }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
  );
}
function IconX({ className = '', size = 16 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
  );
}
function IconCheck({ className = '', size = 16 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
  );
}
function IconPlus({ className = '', size = 18 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
  );
}
function IconBuilding({ className = '' }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01"/></svg>
  );
}
function IconCalendarPlus({ className = '' }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M12 14v4M10 16h4"/></svg>
  );
}

/**
 * 모바일에서 캘린더 셀을 탭했을 때 뜨는 바텀시트.
 * - 자주 쓰는 공종 칩(원탭으로 추가)
 * - 직접 입력
 * - 기존 항목 보기/삭제
 * - 좌우 화살표로 날짜 이동
 * - 체크 pill(미확정/확정 라벨)로 확정 토글 (2026-05-16: 디자이너 시안 리파인)
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
  useEscape(true, onClose);
  const [content, setContent] = useState('');
  const [vendorMenu, setVendorMenu] = useState(null);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const phases = useCompanyPhases();
  const { displayPhase } = usePhaseLabels();

  function handleDragStart(e) {
    dragStartYRef.current = e.touches[0].clientY;
    setDragging(true);
  }
  function handleDragMove(e) {
    const delta = e.touches[0].clientY - dragStartYRef.current;
    setDragY(delta > 0 ? delta : 0);
  }
  function handleDragEnd() {
    setDragging(false);
    if (dragY > 90) {
      onClose();
    } else {
      setDragY(0);
    }
  }

  const date = fromDateKey(dateKey);
  const dateLabel = `${date.getMonth() + 1}월 ${date.getDate()}일`;
  const dowLabel = DAY_LABELS[date.getDay()];

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
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setVendorMenu({ x: rect.left, y: rect.bottom + 4, entry });
  }

  const canSubmit = content.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:hidden">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className="relative w-full bg-white rounded-t-[18px] max-h-[88vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : 'transform 0.18s ease-out',
        }}
      >

        {/* Drag handle — 잡고 아래로 슬라이드하면 닫힘 */}
        <div
          className="flex justify-center pt-2 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
        >
          <div className="w-9 h-1 bg-gray-300 rounded-full" aria-hidden="true" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-1 px-2 pt-1.5 pb-3 border-b border-[#eef0f4]">
          <button
            onClick={() => onNavigate('prev')}
            disabled={!canPrev}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-navy-700 disabled:text-gray-300"
            aria-label="이전 날짜"
          ><IconChevronLeft /></button>
          <div className="flex-1 text-center font-semibold text-[15px] text-navy-900 tracking-tight">
            {dateLabel} <span className="text-gray-500 font-medium text-[13px] ml-1">{dowLabel}</span>
          </div>
          <button
            onClick={() => onNavigate('next')}
            disabled={!canNext}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-navy-700 disabled:text-gray-300"
            aria-label="다음 날짜"
          ><IconChevronRight /></button>
          <button
            onClick={onClose}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-gray-500"
            aria-label="닫기"
          ><IconX /></button>
        </div>

        {/* 기존 항목 */}
        <div className="flex-1 overflow-y-auto px-3 pt-2 pb-1 flex flex-col gap-1.5">
          {entries.length === 0 ? (
            <div className="py-7 text-center text-[13px] text-slate-400">
              <IconCalendarPlus className="mx-auto mb-2 text-slate-300" />
              아래에서 공정을 골라 일정을 추가하세요
            </div>
          ) : (
            entries.map((e) => {
              const confirmed = e.confirmed;
              return (
                <div
                  key={e.id}
                  className={`relative flex items-center gap-2.5 rounded-lg transition-colors py-2.5 pr-2.5 border ${
                    confirmed
                      ? 'bg-emerald-50 border-emerald-200 pl-[18px]'
                      : 'bg-slate-50 border-[#eef0f4] pl-3'
                  }`}
                >
                  {/* 좌측 확정 컬러바 */}
                  {confirmed && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-emerald-500 rounded-r"
                    />
                  )}

                  {/* 체크 pill — 클릭 시 확정 토글, 미확정/확정 라벨 표시 */}
                  <button
                    type="button"
                    onClick={(ev) => { ev.stopPropagation(); onToggleConfirm(e.id); }}
                    aria-pressed={confirmed}
                    className={`h-[30px] pl-2 pr-2.5 rounded-full inline-flex items-center gap-1 flex-shrink-0 text-[11.5px] font-semibold tracking-tight transition-all ${
                      confirmed
                        ? 'bg-emerald-500 border-[1.5px] border-emerald-500 text-white shadow-[0_1px_3px_rgba(16,185,129,0.35)]'
                        : 'bg-white border-[1.5px] border-dashed border-slate-400 text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-[1.5px] inline-flex items-center justify-center ${
                        confirmed ? 'bg-white border-white text-emerald-500' : 'border-slate-400 text-transparent'
                      }`}
                    >
                      <IconCheck size={10} />
                    </span>
                    {confirmed ? '확정' : '미확정'}
                  </button>

                  {/* 본문 */}
                  <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <PhaseInlineContent entry={e} alwaysShowRemainder chipSize="lg" textClassName="text-[13.5px] text-gray-800" />
                    </div>
                    {e.vendor && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-violet-700">
                        <IconBuilding /> {e.vendor.name}
                      </span>
                    )}
                  </div>

                  {SHOW_VENDOR_REGISTRATION && onUpdate && (
                    <button
                      onClick={(ev) => openVendorMenu(ev, e)}
                      className="p-1.5 text-gray-400 hover:text-violet-600 rounded"
                      title="협력업체 태그"
                      aria-label="협력업체 태그"
                    ><IconBuilding /></button>
                  )}
                  <button
                    onClick={(ev) => { ev.stopPropagation(); onDelete(e.id); }}
                    className="p-1.5 text-slate-300 hover:text-slate-500 rounded flex-shrink-0"
                    aria-label="삭제"
                  ><IconX size={14} /></button>
                </div>
              );
            })
          )}
        </div>

        {/* 빠른 추가 — 섹션 라벨 */}
        <div className="px-4 pt-3 pb-2 text-[11px] font-medium text-slate-400 tracking-tight border-t border-[#eef0f4] bg-[#fafbfc]">
          빠른 추가 <span className="text-slate-300 ml-1.5 font-normal">공정을 탭하면 바로 등록</span>
        </div>

        {/* 빠른 공종 칩 — 흰 카드 + 좌측 색 dot */}
        <div className="grid grid-cols-5 gap-1.5 px-3 pb-3.5 bg-[#fafbfc]">
          {phases.map((c) => (
            <button
              key={c}
              onClick={() => quickAddCategory(c)}
              className="flex flex-col items-center gap-[3px] py-2.5 px-1 rounded-lg bg-white border border-[#eef0f4] text-[12px] font-medium text-gray-800 active:scale-[0.97] transition-transform"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${categoryDotClass(c)}`} />
              {displayPhase(c)}
            </button>
          ))}
        </div>

        {/* 직접 입력 */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-3.5 bg-white border-t border-[#eef0f4]">
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="기타 일정을 입력하세요"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-[13.5px] outline-none focus:border-navy-700 placeholder:text-slate-400"
          />
          <button
            onClick={handleAdd}
            disabled={!canSubmit}
            className="w-[38px] h-[38px] inline-flex items-center justify-center rounded-lg bg-navy-700 text-white disabled:bg-gray-200 disabled:text-gray-300"
            aria-label="추가"
          ><IconPlus /></button>
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
