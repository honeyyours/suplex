import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const KEY = 'suplex-theme'; // 'light' | 'dark' | 'system'

function applyTheme(value) {
  const resolved = value === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : value;
  if (resolved === 'dark') document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem(KEY) || 'system'; } catch { return 'system'; }
  });

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(KEY, theme); } catch {}
  }, [theme]);

  // 시스템 변경 동기화 (system 모드일 때만)
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const isDark = theme === 'dark' ||
    (theme === 'system' && typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme must be inside ThemeProvider');
  return v;
}
