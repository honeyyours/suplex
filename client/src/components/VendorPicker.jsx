import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vendorsApi } from '../api/vendors';

/**
 * 일정 항목 내 협력업체 태그용 드롭다운+검색 picker.
 * VendorAutocomplete보다 시각적으로 명확한 드롭다운 형태.
 */
export default function VendorPicker({
  currentVendorId,
  currentVendorName,
  category,
  onSelect,    // (vendorId | null) => Promise
  onClose,
}) {
  const [search, setSearch] = useState('');
  const { data } = useQuery({
    queryKey: ['vendors', 'list'],
    queryFn: () => vendorsApi.list(),
  });
  const vendors = data?.vendors || [];

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

  return (
    <div
      className="bg-white border-2 border-violet-500 rounded-md shadow-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 p-1 border-b">
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'Enter' && filtered[0]) pick(filtered[0].id);
          }}
          placeholder={category ? `'${category}' 협력업체 검색` : '협력업체 검색'}
          className="flex-1 text-[11px] border rounded px-1 py-0.5 outline-none focus:border-violet-500"
        />
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700 px-1.5"
        >✕</button>
      </div>
      <div className="max-h-40 overflow-y-auto">
        {currentVendorId && (
          <button
            onClick={() => pick(null)}
            className="w-full text-left text-[11px] px-2 py-1.5 hover:bg-red-50 text-red-600 border-b"
          >
            ✕ 태그 제거 ({currentVendorName})
          </button>
        )}
        {filtered.length === 0 ? (
          <div className="text-[11px] text-gray-400 px-2 py-3 text-center">
            {category ? `'${category}' 공종 협력업체 없음` : '결과 없음'}
          </div>
        ) : (
          filtered.map((v) => (
            <button
              key={v.id}
              onClick={() => pick(v.id)}
              className={`w-full text-left text-[11px] px-2 py-1.5 hover:bg-violet-50 ${
                v.id === currentVendorId ? 'bg-violet-100' : ''
              }`}
            >
              <div className="font-medium text-gray-800 truncate">{v.name}</div>
              <div className="text-[10px] text-gray-500 truncate">
                {v.category}{v.contact ? ` · ${v.contact}` : ''}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
