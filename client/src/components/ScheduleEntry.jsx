import { useState, useEffect, useRef } from 'react';
import { categoryClass } from '../utils/date';
import { useCompanyPhases } from '../hooks/useCompanyPhases';
import VendorPicker from './VendorPicker';
import ContextMenu from './ContextMenu';
import PhaseInlineContent from './PhaseInlineContent';
import { usePhaseLabels } from '../contexts/PhaseLabelsContext';

export default function ScheduleEntry({ entry, onUpdate, onDelete, onToggleConfirm, showVendorButton = false }) {
  const [editing, setEditing] = useState(false);
  const [vendorMenu, setVendorMenu] = useState(null); // { x, y } | null
  const [contextMenu, setContextMenu] = useState(null); // { x, y } or null
  const [categoryPicker, setCategoryPicker] = useState(null); // { x, y } | null
  const [content, setContent] = useState(entry.content);
  const inputRef = useRef(null);
  const entryRef = useRef(null);
  const handledRef = useRef(false);

  function openVendorMenu(anchorEl) {
    const rect = (anchorEl || entryRef.current)?.getBoundingClientRect();
    if (!rect) return;
    setVendorMenu({ x: rect.left, y: rect.bottom + 4 });
  }

  function openCategoryPicker() {
    const rect = entryRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCategoryPicker({ x: rect.left, y: rect.bottom + 4 });
  }

  async function pickCategory(cat) {
    setCategoryPicker(null);
    if (cat === entry.category) return;
    await onUpdate(entry.id, { category: cat || null });
  }

  useEffect(() => {
    if (editing) {
      handledRef.current = false;
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // 외부에서 entry.content가 바뀌면 동기화 (편집 중이 아닐 때만)
  useEffect(() => {
    if (!editing) setContent(entry.content);
  }, [entry.content, editing]);

  async function save() {
    if (handledRef.current) return;
    handledRef.current = true;
    const trimmed = content.trim();
    if (!trimmed) {
      setContent(entry.content);
      setEditing(false);
      return;
    }
    if (trimmed !== entry.content) {
      await onUpdate(entry.id, { content: trimmed });
    }
    setEditing(false);
  }

  function cancel() {
    handledRef.current = true;
    setContent(entry.content);
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); save(); }
          else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
        }}
        onBlur={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full text-[11px] sm:text-xs border border-navy-500 rounded px-1 py-0.5 outline-none ring-1 ring-navy-500 bg-white"
      />
    );
  }


  const catColor = entry.category ? categoryClass(entry.category) : 'bg-gray-100 text-gray-700';
  return (
    <>
      <div
        ref={entryRef}
        onClick={(e) => {
          // 모바일에서는 셀 탭 → 바텀시트로 처리하므로 여기서 무시
          if (window.innerWidth < 640) return;
          // 내부 버튼 클릭은 자체 핸들러 유지
          if (e.target.closest('button')) return;
          e.stopPropagation(); // 셀 클릭으로 인라인 입력 열리지 않도록
          setEditing(true);
        }}
        onContextMenu={(e) => {
          if (window.innerWidth < 640) return;
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        className={`
          relative group text-[9px] sm:text-xs rounded-sm sm:rounded pl-0.5 pr-0 sm:px-1.5 py-0.5 sm:py-1 flex items-center gap-1 truncate sm:cursor-pointer
          ${catColor} sm:!bg-navy-50/60 sm:dark:!bg-slate-800/60 sm:!text-navy-800 sm:dark:!text-slate-200
          sm:border-l-2 ${entry.confirmed ? 'sm:border-emerald-500 sm:!bg-emerald-50 sm:dark:!bg-emerald-950/40' : 'sm:border-navy-400'}
        `}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <PhaseInlineContent entry={entry} />
            {entry.vendor && (
              <span className="hidden sm:inline-block text-xs sm:text-[10px] px-1 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                🏢 {entry.vendor.name}
              </span>
            )}
          </div>
        </div>
        {entry.confirmed && (
          <span className="absolute right-0.5 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold pointer-events-none drop-shadow-[0_0_2px_rgba(255,255,255,0.9)] z-10">✓</span>
        )}
        <div className="hidden sm:flex absolute right-0.5 top-1/2 -translate-y-1/2 gap-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition z-20">
          {showVendorButton && (
            <button
              onClick={(e) => openVendorMenu(e.currentTarget)}
              title="협력업체 태그"
              className="text-xs sm:text-[10px] text-gray-500 hover:text-violet-700 bg-white rounded shadow-sm border border-gray-200 px-1 leading-none py-0.5"
            >
              🏢
            </button>
          )}
          <button
            onClick={() => onDelete(entry.id)}
            title="삭제"
            className="text-xs sm:text-[10px] text-gray-500 hover:text-rose-600 bg-white rounded shadow-sm border border-gray-200 px-1 leading-none py-0.5"
          >
            ✕
          </button>
        </div>
      </div>
      {vendorMenu && (
        <VendorPicker
          x={vendorMenu.x}
          y={vendorMenu.y}
          currentVendorId={entry.vendor?.id || null}
          currentVendorName={entry.vendor?.name || ''}
          category={entry.category}
          onSelect={async (vendorId) => {
            const oldId = entry.vendor?.id || null;
            if (vendorId !== oldId) {
              await onUpdate(entry.id, { vendorId });
            }
          }}
          onClose={() => setVendorMenu(null)}
        />
      )}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: entry.confirmed ? '✓ 확정 해제' : '✓ 확정',
              onClick: () => onToggleConfirm(entry.id),
            },
            {
              label: `🏷 공종 변경${entry.category ? ` (${entry.category})` : ''}`,
              onClick: () => openCategoryPicker(),
            },
            ...(showVendorButton ? [{
              label: '🏢 협력업체 태그',
              onClick: () => openVendorMenu(),
            }] : []),
            {
              label: '✕ 삭제',
              danger: true,
              onClick: () => onDelete(entry.id),
            },
          ]}
        />
      )}
      {categoryPicker && (
        <CategoryPickerPopover
          x={categoryPicker.x}
          y={categoryPicker.y}
          current={entry.category}
          onPick={pickCategory}
          onClose={() => setCategoryPicker(null)}
        />
      )}
    </>
  );
}

function CategoryPickerPopover({ x, y, current, onPick, onClose }) {
  const ref = useRef(null);
  const phases = useCompanyPhases();
  const { displayPhase } = usePhaseLabels();
  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const maxX = typeof window !== 'undefined' ? window.innerWidth - 220 : x;
  const safeX = Math.min(x, maxX);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left: safeX, top: y, zIndex: 70 }}
      className="bg-white border rounded-md shadow-lg p-2 w-[210px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-xs sm:text-[10px] text-gray-500 mb-1.5">공종 선택</div>
      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={() => onPick(null)}
          className={`text-[11px] py-1 rounded ${!current ? 'ring-2 ring-navy-500' : ''} bg-gray-100 text-gray-700 hover:bg-gray-200`}
        >
          (없음)
        </button>
        {phases.map((c) => (
          <button
            key={c}
            onClick={() => onPick(c)}
            className={`text-[11px] py-1 rounded ${current === c ? 'ring-2 ring-navy-500' : ''} ${categoryClass(c)} hover:opacity-80`}
          >{displayPhase(c)}</button>
        ))}
      </div>
    </div>
  );
}
