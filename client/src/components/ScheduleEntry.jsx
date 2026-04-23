import { useState, useEffect, useRef } from 'react';
import { categoryClass } from '../utils/date';
import VendorPicker from './VendorPicker';
import ContextMenu from './ContextMenu';

export default function ScheduleEntry({ entry, onUpdate, onDelete, onToggleConfirm, showVendorButton = false }) {
  const [editing, setEditing] = useState(false);
  const [editingVendor, setEditingVendor] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y } or null
  const [content, setContent] = useState(entry.content);
  const inputRef = useRef(null);
  const handledRef = useRef(false);

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

  if (editingVendor) {
    return (
      <VendorPicker
        currentVendorId={entry.vendor?.id || null}
        currentVendorName={entry.vendor?.name || ''}
        category={entry.category}
        onSelect={async (vendorId) => {
          const oldId = entry.vendor?.id || null;
          if (vendorId !== oldId) {
            await onUpdate(entry.id, { vendorId });
          }
        }}
        onClose={() => setEditingVendor(false)}
      />
    );
  }

  const catColor = entry.category ? categoryClass(entry.category) : 'bg-gray-100 text-gray-700';
  return (
    <>
      <div
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
          ${catColor} sm:bg-navy-50/60 sm:text-navy-800
          sm:border-l-2 ${entry.confirmed ? 'sm:border-emerald-500 sm:bg-emerald-50' : 'sm:border-navy-400'}
        `}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            {entry.confirmed && (
              <span className="hidden sm:inline text-emerald-600 text-[11px] font-bold leading-none flex-shrink-0">✓</span>
            )}
            {entry.category && (
              <span className={`hidden sm:inline-block text-[10px] px-1 py-0.5 rounded ${catColor}`}>
                {entry.category}
              </span>
            )}
            <span className="truncate">
              {entry.content}
            </span>
            {entry.vendor && (
              <span className="hidden sm:inline-block text-[10px] px-1 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                🏢 {entry.vendor.name}
              </span>
            )}
          </div>
        </div>
        {entry.confirmed && (
          <span className="sm:hidden absolute right-0.5 top-1/2 -translate-y-1/2 text-emerald-600 text-[10px] font-bold pointer-events-none drop-shadow-[0_0_2px_rgba(255,255,255,0.9)]">✓</span>
        )}
        <div className="hidden sm:flex absolute right-0.5 top-1/2 -translate-y-1/2 gap-0.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition">
          {showVendorButton && (
            <button
              onClick={() => setEditingVendor(true)}
              title="협력업체 태그"
              className="text-[10px] text-gray-500 hover:text-violet-700 bg-white rounded shadow-sm border border-gray-200 px-1 leading-none py-0.5"
            >
              🏢
            </button>
          )}
          <button
            onClick={() => onDelete(entry.id)}
            title="삭제"
            className="text-[10px] text-gray-500 hover:text-red-600 bg-white rounded shadow-sm border border-gray-200 px-1 leading-none py-0.5"
          >
            ✕
          </button>
        </div>
      </div>
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
            ...(showVendorButton ? [{
              label: '🏢 협력업체 태그',
              onClick: () => setEditingVendor(true),
            }] : []),
            {
              label: '✕ 삭제',
              danger: true,
              onClick: () => onDelete(entry.id),
            },
          ]}
        />
      )}
    </>
  );
}
