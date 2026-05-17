// PlanGuide 가시성 토글 — 다크모드 패턴
// 봉기님 결정(2026-05-17): "어떤 등급에서 어떤 기능이 더 붙는지" 사용자가 한눈에 파악할 수 있게
// 잠긴 기능 영역에 안내. 토글로 끄고 켤 수 있음 (헤더 다크모드 옆).
import { createContext, useContext, useEffect, useState } from 'react';

const PlanGuideContext = createContext(null);

const KEY = 'suplex-plan-guide-visible';

export function PlanGuideProvider({ children }) {
  const [visible, setVisibleState] = useState(() => {
    try {
      const v = localStorage.getItem(KEY);
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY, String(visible)); } catch {}
  }, [visible]);

  return (
    <PlanGuideContext.Provider value={{ visible, setVisible: setVisibleState }}>
      {children}
    </PlanGuideContext.Provider>
  );
}

export function usePlanGuide() {
  const v = useContext(PlanGuideContext);
  if (!v) throw new Error('usePlanGuide must be inside PlanGuideProvider');
  return v;
}
