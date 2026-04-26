import { useEffect, useRef } from 'react';

/**
 * 우클릭 컨텍스트 메뉴.
 * Props:
 *  - x, y: 화면 좌표 (clientX/clientY)
 *  - items: [{ label, onClick, disabled?, danger? }]
 *  - onClose: () => void
 */
export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleEsc(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('contextmenu', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('contextmenu', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // 화면 밖으로 나가지 않게 보정
  const maxX = typeof window !== 'undefined' ? window.innerWidth - 180 : x;
  const maxY = typeof window !== 'undefined' ? window.innerHeight - 60 - items.length * 32 : y;
  const safeX = Math.min(x, maxX);
  const safeY = Math.min(y, maxY);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left: safeX, top: safeY, zIndex: 60 }}
      className="bg-white border rounded-md shadow-lg py-1 min-w-[140px]"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <button
          key={i}
          disabled={item.disabled}
          onClick={() => {
            if (item.disabled) return;
            item.onClick();
            onClose();
          }}
          className={`block w-full text-left px-3 py-1.5 text-xs ${
            item.disabled
              ? 'text-gray-300 cursor-not-allowed'
              : item.danger
              ? 'text-rose-600 hover:bg-rose-50'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
