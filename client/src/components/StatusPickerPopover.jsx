import { useEffect, useRef } from 'react';
import { STATUS_OPTIONS } from '../api/materials';

// 마감재 status 빠른 변경 팝오버. position fixed.
export default function StatusPickerPopover({ x, y, current, onPick, onClose }) {
  const ref = useRef(null);
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

  const maxX = typeof window !== 'undefined' ? window.innerWidth - 220 : x;
  const safeX = Math.min(x - 200, maxX);

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left: Math.max(8, safeX), top: y, zIndex: 60 }}
      className="bg-white border rounded-md shadow-lg py-1 min-w-[200px]"
      onClick={(e) => e.stopPropagation()}
    >
      {STATUS_OPTIONS.map((o) => {
        const isCurrent = o.key === current ||
          (o.key === 'CONFIRMED' && current === 'CHANGED') ||
          (o.key === 'UNDECIDED' && current === 'REVIEWING');
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onPick(o.key)}
            className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
              isCurrent ? 'bg-gray-50 font-semibold text-navy-800' : 'text-gray-700'
            }`}
          >
            {o.label}
            {isCurrent && <span className="float-right text-emerald-600">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
