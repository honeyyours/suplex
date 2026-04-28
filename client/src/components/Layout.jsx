import { useEffect, useRef, useState } from 'react';
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
  const { auth, memberships, switchCompany } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const navItems = NAV.filter((n) => !n.feature || canAccess(auth, n.feature));
  const hasMultipleCompanies = (memberships?.length || 0) >= 2;

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
              {hasMultipleCompanies ? (
                <CompanySwitcher
                  current={auth?.company}
                  memberships={memberships}
                  onSwitch={switchCompany}
                />
              ) : (
                <>{auth?.company?.name}</>
              )}
              {' · '}{auth?.user?.name}
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

const ROLE_LABEL = { OWNER: '대표', DESIGNER: '디자이너', FIELD: '현장팀' };

function CompanySwitcher({ current, memberships, onSwitch }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function handleSwitch(companyId) {
    if (busy || companyId === current?.id) { setOpen(false); return; }
    setBusy(true);
    try {
      await onSwitch(companyId);
      setOpen(false);
      // 회사 컨텍스트가 바뀌었으니 깨끗한 상태로 진입
      window.location.href = '/';
    } catch (e) {
      alert('회사 전환 실패: ' + (e.response?.data?.error || e.message));
      setBusy(false);
    }
  }

  return (
    <span ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-navy-100 hover:text-white inline-flex items-center gap-1"
      >
        {current?.name || '—'}
        <span className="text-xs">▼</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white text-gray-800 rounded shadow-lg border min-w-[220px] py-1">
          <div className="px-3 py-1 text-[10px] text-gray-400 uppercase">소속 회사</div>
          {memberships.map((m) => {
            const active = m.companyId === current?.id;
            return (
              <button
                key={m.companyId}
                onClick={() => handleSwitch(m.companyId)}
                disabled={busy}
                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-navy-50 ${
                  active ? 'bg-navy-50' : ''
                } disabled:opacity-50`}
              >
                <span className="flex-1 truncate">
                  {active && <span className="text-navy-700 mr-1">✓</span>}
                  {m.companyName}
                </span>
                <span className="text-[10px] text-gray-500 ml-2">{ROLE_LABEL[m.role] || m.role}</span>
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
