import { useEffect, useMemo, useRef, useState } from 'react';
import { vendorsApi } from '../api/vendors';

// 회사 협력업체 목록 캐시 (5분)
let cache = null;
let cacheTime = 0;

async function loadVendors() {
  const now = Date.now();
  if (cache && now - cacheTime < 5 * 60 * 1000) return cache;
  const { vendors } = await vendorsApi.list();
  cache = vendors;
  cacheTime = now;
  return vendors;
}

export function invalidateVendorCache() {
  cache = null;
  cacheTime = 0;
}

/**
 * 협력업체 선택 콤보박스
 *
 * Props:
 *  - value: { id?, name } 또는 텍스트 string. 외부 양방향 바인딩
 *  - onChange: ({ vendorId, vendorName }) => void
 *  - category: 카테고리(공종) 필터 (선택)
 *  - placeholder
 *  - allowFreeText: 등록되지 않은 vendor 자유 입력 허용 (default true — 지출은 자유 입력 OK)
 */
export default function VendorAutocomplete({
  value,
  onChange,
  category,
  placeholder = '협력업체 검색 또는 직접 입력',
  allowFreeText = true,
  className = '',
}) {
  const initialText =
    typeof value === 'string'
      ? value
      : value?.name || value?.vendorName || '';
  const initialId =
    typeof value === 'object' ? value?.id || value?.vendorId || null : null;

  const [text, setText] = useState(initialText);
  const [selectedId, setSelectedId] = useState(initialId);
  const [vendors, setVendors] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    loadVendors().then(setVendors).catch(() => {});
  }, []);

  // 외부 value 변경 동기화
  useEffect(() => {
    const newText =
      typeof value === 'string' ? value : value?.name || value?.vendorName || '';
    const newId = typeof value === 'object' ? value?.id || value?.vendorId || null : null;
    setText(newText);
    setSelectedId(newId);
  }, [value]);

  // 외부 클릭 닫기
  useEffect(() => {
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const filtered = useMemo(() => {
    let list = vendors;
    if (category) list = list.filter((v) => v.category === category);
    const q = text.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          (v.contact || '').toLowerCase().includes(q) ||
          (v.phone || '').includes(q)
      );
    }
    return list.slice(0, 8);
  }, [vendors, category, text]);

  function commit(text, vendorId) {
    setText(text);
    setSelectedId(vendorId);
    onChange?.({ vendorId, vendorName: text });
    setOpen(false);
  }

  function handleKey(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = filtered[highlight];
      if (pick) commit(pick.name, pick.id);
      else if (allowFreeText) commit(text.trim(), null);
    }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  function handleBlur() {
    // 텍스트만 입력된 경우 free text로 커밋
    setTimeout(() => {
      if (!open) return;
      if (allowFreeText && text.trim() && !selectedId) {
        onChange?.({ vendorId: null, vendorName: text.trim() });
      }
      setOpen(false);
    }, 150);
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setSelectedId(null);
          setOpen(true);
          setHighlight(0);
          if (allowFreeText) onChange?.({ vendorId: null, vendorName: e.target.value });
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKey}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full px-3 py-2 border rounded text-sm"
      />
      {selectedId && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-600">
          ✓ 등록됨
        </span>
      )}

      {open && (filtered.length > 0 || (allowFreeText && text.trim())) && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">
              등록된 협력업체 없음 — 자유 입력 사용
            </div>
          ) : (
            filtered.map((v, i) => (
              <button
                key={v.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); commit(v.name, v.id); }}
                onMouseEnter={() => setHighlight(i)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 ${
                  i === highlight ? 'bg-navy-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">{v.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {v.category}{v.contact ? ` · ${v.contact}` : ''}{v.phone ? ` · ${v.phone}` : ''}
                  </div>
                </div>
                {v.unitPrice && (
                  <div className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
                    {Number(v.unitPrice).toLocaleString('ko-KR')}{v.unit ? `/${v.unit}` : ''}
                  </div>
                )}
              </button>
            ))
          )}
          {allowFreeText && text.trim() && !filtered.some((v) => v.name === text.trim()) && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); commit(text.trim(), null); }}
              className="w-full text-left px-3 py-2 text-sm border-t bg-gray-50 hover:bg-gray-100"
            >
              <span className="text-gray-500">자유 입력:</span> <span className="font-medium">{text.trim()}</span>
              <span className="text-xs text-gray-400 ml-2">(미등록)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
