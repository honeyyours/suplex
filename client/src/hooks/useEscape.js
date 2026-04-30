import { useEffect } from 'react';

// 모달·드로어 ESC 닫기 공용 훅. open=true일 때만 listener 등록.
// 다른 모달이 위에 떠 있으면 e.stopPropagation 호출자가 처리. 기본은 전역 keydown 1회.
export function useEscape(open, onClose) {
  useEffect(() => {
    if (!open || typeof onClose !== 'function') return;
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
}
