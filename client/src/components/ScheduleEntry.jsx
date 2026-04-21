import { useState, useEffect, useRef } from 'react';
import { categoryClass, CATEGORIES } from '../utils/date';

export default function ScheduleEntry({ entry, onUpdate, onDelete, onToggleConfirm }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(entry.content);
  const [category, setCategory] = useState(entry.category || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function save() {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed === entry.content && (category || null) === (entry.category || null)) {
      setEditing(false);
      return;
    }
    await onUpdate(entry.id, { content: trimmed, category: category || null });
    setEditing(false);
  }

  function cancel() {
    setContent(entry.content);
    setCategory(entry.category || '');
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
        <div className="flex gap-1">
          <button onClick={save} className="flex-1 text-[11px] bg-navy-700 text-white rounded py-0.5">저장</button>
          <button onClick={cancel} className="text-[11px] bg-gray-200 rounded px-2">취소</button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group text-xs rounded px-1.5 py-1 border-l-2 flex items-start gap-1 ${
        entry.confirmed ? 'border-emerald-500 bg-emerald-50' : 'border-navy-400 bg-navy-50/60'
      }`}
    >
      <button
        onClick={() => onToggleConfirm(entry.id)}
        title={entry.confirmed ? '확정 해제' : '확정'}
        className={`mt-0.5 w-3.5 h-3.5 rounded-sm flex items-center justify-center flex-shrink-0 border ${
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
            <span className={`text-[10px] px-1 py-0.5 rounded ${categoryClass(entry.category)}`}>
              {entry.category}
            </span>
          )}
          <span className={`truncate ${entry.confirmed ? 'text-gray-700' : 'text-navy-800'}`}>
            {entry.content}
          </span>
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition flex gap-0.5">
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
