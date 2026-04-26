import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorsApi } from '../api/vendors';

/**
 * 일정 항목 내 협력업체 태그용 드롭다운+검색 picker.
 * 화면 좌표(x, y)에 fixed 위치로 렌더링되는 플로팅 팝오버.
 *
 * Props:
 *  - x, y: 화면 좌표
 *  - currentVendorId, currentVendorName: 현재 태그된 업체
 *  - category: 카테고리 자동 필터
 *  - onSelect: (vendorId | null) => Promise
 *  - onClose: () => void
 */
export default function VendorPicker({
  x,
  y,
  currentVendorId,
  currentVendorName,
  category,
  onSelect,
  onClose,
}) {
  const ref = useRef(null);
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['vendors', 'list'],
    queryFn: () => vendorsApi.list(),
  });
  const vendors = data?.vendors || [];

  // 외부 클릭 / Esc로 닫기
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

  const filtered = vendors.filter((v) => {
    if (category && v.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        (v.contact || '').toLowerCase().includes(q) ||
        (v.phone || '').includes(q)
      );
    }
    return true;
  });

  async function pick(id) {
    await onSelect(id);
    onClose();
  }

  // 화면 밖으로 나가지 않게 보정
  const W = 240;
  const H = 280;
  const safeX = typeof window !== 'undefined' ? Math.min(x, window.innerWidth - W - 8) : x;
  const safeY = typeof window !== 'undefined' ? Math.min(y, window.innerHeight - H - 8) : y;

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left: safeX, top: safeY, width: W, zIndex: 60 }}
      className="bg-white border border-violet-300 rounded-md shadow-lg flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 p-1.5 border-b">
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered[0]) pick(filtered[0].id);
          }}
          placeholder={category ? `'${category}' 협력업체 검색` : '협력업체 검색'}
          className="flex-1 text-xs border rounded px-2 py-1 outline-none focus:border-violet-500"
        />
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: H - 50 }}>
        {currentVendorId && (
          <button
            onClick={() => pick(null)}
            className="w-full text-left text-xs px-2 py-1.5 hover:bg-rose-50 text-rose-600 border-b"
          >
            ✕ 태그 제거 <span className="text-gray-500">({currentVendorName})</span>
          </button>
        )}
        {filtered.length === 0 ? (
          <div className="text-xs text-gray-400 px-2 py-3 text-center">
            {category ? `'${category}' 공종 협력업체 없음` : '결과 없음'}
          </div>
        ) : (
          filtered.map((v) => (
            <button
              key={v.id}
              onClick={() => pick(v.id)}
              className={`w-full text-left text-xs px-2 py-1.5 hover:bg-violet-50 ${
                v.id === currentVendorId ? 'bg-violet-100' : ''
              }`}
            >
              <div className="font-medium text-gray-800 truncate">{v.name}</div>
              <div className="text-xs sm:text-[10px] text-gray-500 truncate">
                {v.category}{v.contact ? ` · ${v.contact}` : ''}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
