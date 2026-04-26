// 공통 햄버거 메뉴 — 우측 상단 ☰ 버튼 클릭 시 드롭다운으로 항목 표시.
// items: [{ icon?, label, onClick, divider? }] 또는 { divider: true }
import { useState } from 'react';

export default function ProjectActionsMenu({ items, label = '☰' }) {
  const [open, setOpen] = useState(false);

  function handle(item) {
    setOpen(false);
    item.onClick?.();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-base px-3 py-1.5 border rounded hover:bg-gray-50 leading-none"
        title="메뉴"
        aria-label="메뉴"
      >
        {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-44 bg-white border rounded-md shadow-lg z-20 overflow-hidden">
            {items.map((item, i) =>
              item.divider ? (
                <div key={`d-${i}`} className="border-t" />
              ) : (
                <button
                  key={i}
                  onClick={() => handle(item)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
