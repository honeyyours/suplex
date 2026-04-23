import { useState, useEffect, useRef } from 'react';
import { categoryClass, CATEGORIES } from '../utils/date';
import VendorAutocomplete from './VendorAutocomplete';

export default function ScheduleEntry({ entry, onUpdate, onDelete, onToggleConfirm }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(entry.content);
  const [category, setCategory] = useState(entry.category || '');
  const [vendor, setVendor] = useState({
    vendorId: entry.vendor?.id || entry.vendorId || null,
    vendorName: entry.vendor?.name || '',
  });
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save() {
    const trimmed = content.trim();
    if (!trimmed) return;
    const newVendorId = vendor.vendorId || null;
    const oldVendorId = entry.vendor?.id || entry.vendorId || null;
    if (
      trimmed === entry.content &&
      (category || null) === (entry.category || null) &&
      newVendorId === oldVendorId
    ) {
      setEditing(false);
      return;
    }
    await onUpdate(entry.id, {
      content: trimmed,
      category: category || null,
      vendorId: newVendorId,
    });
    setEditing(false);
  }

  function cancel() {
    setContent(entry.content);
    setCategory(entry.category || '');
    setVendor({
      vendorId: entry.vendor?.id || entry.vendorId || null,
      vendorName: entry.vendor?.name || '',
    });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="border-2 border-navy-500 rounded bg-white p-1.5 space-y-1">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full text-[11px] border rounded px-1 py-0.5 bg-white"
        >
          <option value="">(공종 없음)</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancel();
            else if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); save(); }
          }}
          rows={2}
          className="w-full text-xs border rounded px-1 py-0.5 resize-none"
        />
        <VendorAutocomplete
          value={vendor}
          onChange={setVendor}
          category={category}
          placeholder="협력업체 (선택)"
          allowFreeText={false}
        />
        <div className="flex gap-1">
          <button onClick={save} className="flex-1 text-[11px] bg-navy-700 text-white rounded py-0.5">저장</button>
          <button onClick={cancel} className="text-[11px] bg-gray-200 rounded px-2">취소</button>
        </div>
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
      <div className="hidden sm:flex opacity-0 group-hover:opacity-100 transition gap-0.5">
        <button
          onClick={() => setEditing(true)}
          className="text-[10px] text-gray-500 hover:text-navy-700 px-1"
        >
          ✎
        </button>
        <button
          onClick={() => {
            if (confirm('이 항목을 삭제할까요?')) onDelete(entry.id);
          }}
          className="text-[10px] text-gray-500 hover:text-red-600 px-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
