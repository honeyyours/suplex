import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * 콤보박스 — 인라인 테이블 셀에서 검색+드롭다운 동시 사용.
 * 비어있으면 placeholder 표시, 클릭/포커스 시 전체 목록 펼침, 타이핑으로 필터.
 *
 * Props:
 *  - value: string|null — 선택된 id ('' / null = 미지정)
 *  - options: Array<{ id, label, hint?, group? }>
 *  - onChange: (id|null) => void
 *  - placeholder
 *  - emptyLabel: 빈 옵션 라벨 (예: "(미지정)" / "(미분류)")
 *  - allowEmpty: emptyLabel 옵션 노출 여부 (default true)
 *  - className: 입력 추가 클래스
 *  - inputClassName: input 자체 클래스 (모달용 일반 사이즈로 override 가능)
 */
export default function InlineCombobox({
  value,
  options,
  onChange,
  placeholder = '검색…',
  emptyLabel = '(미지정)',
  allowEmpty = true,
  className = '',
  inputClassName,
}) {
  const selected = value ? options.find((o) => o.id === value) : null;
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  // 외부 value 바뀌면 텍스트도 reset
  useEffect(() => {
    if (!open) setText('');
  }, [value, open]);

  // 외부 클릭 닫기
  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setText('');
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(q) ||
      (o.hint || '').toLowerCase().includes(q) ||
      (o.group || '').toLowerCase().includes(q)
    );
  }, [options, text]);

  function commit(id) {
    onChange?.(id || null);
    setOpen(false);
    setText('');
    inputRef.current?.blur();
  }

  function handleKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (open && filtered[highlight]) commit(filtered[highlight].id);
    }
    else if (e.key === 'Escape') { setOpen(false); setText(''); }
    else if (e.key === 'Backspace' && !text && selected) {
      commit('');
    }
  }

  // 표시 텍스트: 펼친 상태면 검색어, 닫혔으면 선택값 라벨 (또는 placeholder)
  const displayValue = open ? text : (selected ? selected.label : '');

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        value={displayValue}
        onChange={(e) => { setText(e.target.value); setOpen(true); setHighlight(0); }}
        onFocus={() => { setOpen(true); setHighlight(0); }}
        onKeyDown={handleKey}
        placeholder={selected ? '' : placeholder}
        className={inputClassName ?? `w-full text-xs border border-transparent hover:border-gray-300 focus:border-navy-400 rounded px-1 py-0.5 bg-transparent ${selected ? '' : 'text-gray-400'}`}
      />
      {open && (
        <div className="absolute z-30 left-0 right-0 mt-0.5 bg-white border rounded shadow-lg max-h-64 overflow-y-auto min-w-[180px]">
          {allowEmpty && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); commit(''); }}
              className={`w-full text-left px-2 py-1 text-xs text-gray-500 italic ${value ? 'hover:bg-gray-50' : 'bg-gray-50'}`}
            >
              {emptyLabel}
            </button>
          )}
          {filtered.length === 0 ? (
            <div className="px-2 py-1.5 text-xs text-gray-400">검색 결과 없음</div>
          ) : (
            filtered.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); commit(o.id); }}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full text-left px-2 py-1 text-xs flex items-center justify-between gap-2 ${
                  i === highlight ? 'bg-navy-50' : (o.id === value ? 'bg-emerald-50' : 'hover:bg-gray-50')
                }`}
              >
                <span className="truncate">{o.label}</span>
                {o.hint && <span className="text-gray-400 truncate text-[10px] flex-shrink-0">{o.hint}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
