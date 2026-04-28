import { useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { F, canAccess } from '../utils/features';

const NAV = [
  { to: '/', label: '홈', exact: true },
  { to: '/schedule', label: '일정' },
  { to: '/projects', label: '프로젝트' },
  { to: '/orders', label: '발주' },
  { to: '/expenses', label: '지출관리', feature: F.EXPENSES_VIEW },
  { to: '/ai-assistant', label: 'AI비서', feature: F.AI_ASSISTANT },
  { to: '/team', label: '팀관리' },
  { to: '/settings', label: '설정' },
];

export default function Layout() {
  const { auth } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navItems = NAV.filter((n) => !n.feature || canAccess(auth, n.feature));

  // 브라우저 기본 우클릭 메뉴 전역 차단. 앱 내부 React onContextMenu는 그대로 발화.
  useEffect(() => {
    const handler = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition ${
      isActive ? 'bg-navy-700 text-white' : 'text-navy-100 hover:bg-navy-700/60'
    }`;

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-navy-800 text-white">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-xl font-bold tracking-tight">SUPLEX</Link>
            <nav className="hidden sm:flex gap-1">
              {navItems.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.exact} className={navClass}>
                  {n.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="text-sm text-navy-100 flex items-center gap-3">
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={`현재: ${theme === 'system' ? '시스템' : theme === 'dark' ? '다크' : '라이트'} (클릭 토글)`}
              className="text-navy-100 hover:text-white text-base px-1.5 py-1 rounded hover:bg-navy-700/60 transition leading-none"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <span className="hidden sm:inline">
              {auth?.company?.name} · {auth?.user?.name}
            </span>
          </div>
        </div>
        <nav className="sm:hidden flex gap-1 px-4 pb-2 overflow-x-auto">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.exact}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${
                  isActive ? 'bg-navy-700 text-white' : 'text-navy-100 hover:bg-navy-700/60'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>
    </div>
  );
}
