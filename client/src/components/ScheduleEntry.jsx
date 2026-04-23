import { useState, useEffect, useRef } from 'react';
import { categoryClass } from '../utils/date';
import VendorAutocomplete from './VendorAutocomplete';

export default function ScheduleEntry({ entry, onUpdate, onDelete, onToggleConfirm, showVendorButton = false }) {
  const [editing, setEditing] = useState(false);
  const [editingVendor, setEditingVendor] = useState(false);
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
      <div
        className="relative bg-white border-2 border-violet-500 rounded p-1 flex gap-1 items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 min-w-0">
          <VendorAutocomplete
            value={{ vendorId: entry.vendor?.id || null, vendorName: entry.vendor?.name || '' }}
            onChange={async ({ vendorId }) => {
              const oldId = entry.vendor?.id || null;
              if (vendorId !== oldId) {
                await onUpdate(entry.id, { vendorId });
              }
              setEditingVendor(false);
            }}
            category={entry.category}
            placeholder="협력업체 검색"
            allowFreeText={false}
          />
        </div>
        <button
          onClick={() => setEditingVendor(false)}
          className="text-xs text-gray-500 hover:text-gray-700 px-1.5 flex-shrink-0"
          title="닫기"
        >✕</button>
      </div>
    );
  }

  const catColor = entry.category ? categoryClass(entry.category) : 'bg-gray-100 text-gray-700';
  return (
    <div
      onClick={(e) => {
        // 모바일에서는 셀 탭 → 바텀시트로 처리하므로 여기서 무시
        if (window.innerWidth < 640) return;
        // 내부 버튼 클릭은 자체 핸들러 유지
        if (e.target.closest('button')) return;
        e.stopPropagation(); // 셀 클릭으로 인라인 입력 열리지 않도록
        setEditing(true);
      }}
      className={`
        relative group text-[9px] sm:text-xs rounded-sm sm:rounded pl-0.5 pr-0 sm:px-1.5 py-0.5 sm:py-1 flex items-center gap-1 truncate sm:cursor-pointer
        ${catColor} sm:bg-navy-50/60 sm:text-navy-800
        sm:border-l-2 ${entry.confirmed ? 'sm:border-emerald-500 sm:bg-emerald-50' : 'sm:border-navy-400'}
      `}
    >
      <button
        onClick={() => onToggleConfirm(entry.id)}
        title={entry.confirmed ? '확정 해제' : '확정'}
        className={`hidden sm:flex mt-0.5 w-3.5 h-3.5 rounded-sm items-center justify-center flex-shrink-0 border ${
          entry.confirmed
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'bg-white border-gray-300 hover:border-emerald-500'
        }`}
      >
        {entry.confirmed && <span className="text-[10px] leading-none">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
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
          onClick={() => {
            if (confirm('이 항목을 삭제할까요?')) onDelete(entry.id);
          }}
          title="삭제"
          className="text-[10px] text-gray-500 hover:text-red-600 bg-white rounded shadow-sm border border-gray-200 px-1 leading-none py-0.5"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
