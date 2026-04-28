// 마감재 "🔗 동일 자재" 링크 모달
// 한 항목을 같은 프로젝트의 다른 항목과 동일하게 시공 — inheritFromMaterialId 셋팅
// 거실의 도배지를 안방·주방도 동일하게 사용하는 인테리어 회사 워크플로
import { useState } from 'react';

export default function MaterialLinkModal({ items, currentItem, onSelect, onClear, onClose }) {
  const [q, setQ] = useState('');
  // 후보: 같은 프로젝트 FINISH 마감재 중 자기 자신 제외 + 이미 다른 곳 참조 중인 것 제외
  // (참조의 참조 방지 — A → B → C 체인 안 됨)
  const candidates = items.filter((it) =>
    it.id !== currentItem.id &&
    it.kind === 'FINISH' &&
    !it.inheritFromMaterialId &&
    (it.itemName || '').trim() !== ''
  );
  const filtered = q.trim()
    ? candidates.filter((it) => {
        const s = `${it.spaceGroup} ${it.itemName} ${it.brand || ''} ${it.productName || ''}`.toLowerCase();
        return s.includes(q.toLowerCase());
      })
    : candidates;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <header className="px-5 py-3 border-b">
          <div className="font-semibold text-navy-800">🔗 동일 자재로 연결</div>
          <div className="text-xs text-gray-500 mt-0.5">
            현재 항목 (<b>{currentItem.spaceGroup} · {currentItem.itemName || '(이름 없음)'}</b>)을
            다른 항목과 동일하게 시공합니다. 원본 변경 시 자동 반영.
          </div>
        </header>
        <div className="px-3 py-2 border-b">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="공간/항목/브랜드/품명 검색"
            className="w-full px-3 py-1.5 border rounded text-sm"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-gray-400 py-8 text-center">
              {candidates.length === 0
                ? '연결 가능한 다른 마감재가 없습니다. 다른 항목을 먼저 입력해주세요.'
                : '검색 결과가 없습니다.'}
            </div>
          ) : filtered.map((it) => (
            <button
              key={it.id}
              onClick={() => onSelect(it.id)}
              className="w-full px-3 py-2 text-left text-sm border rounded hover:bg-emerald-50 hover:border-emerald-200 mb-1"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="font-medium text-gray-800 truncate">
                  <span className="text-navy-600">{it.spaceGroup}</span>
                  <span className="mx-1 text-gray-300">·</span>
                  {it.itemName}
                </div>
                <div className="text-[11px] text-gray-400 whitespace-nowrap">{it.status}</div>
              </div>
              {(it.brand || it.productName || it.spec) && (
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {[it.brand, it.productName, it.spec].filter(Boolean).join(' · ')}
                </div>
              )}
            </button>
          ))}
        </div>
        <footer className="px-5 py-3 border-t flex justify-between">
          {currentItem.inheritFromMaterialId ? (
            <button
              onClick={onClear}
              className="text-sm px-3 py-2 border border-rose-300 text-rose-700 rounded hover:bg-rose-50"
            >🔗 끊기 (독립 항목으로)</button>
          ) : <span />}
          <button onClick={onClose} className="text-sm px-4 py-2 border rounded">닫기</button>
        </footer>
      </div>
    </div>
  );
}
