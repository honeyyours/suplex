import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { F, canAccess } from '../utils/features';
import { announcementsApi } from '../api/announcements';
import PlanBadge from './PlanBadge';

const NAV = [
  { to: '/', label: '홈', mobileLabel: '홈', exact: true, icon: 'home' },
  { to: '/schedule', label: '전체 일정', mobileLabel: '일정', icon: 'calendar' },
  { to: '/projects', label: '프로젝트', mobileLabel: '프로젝트', icon: 'folder' },
  { to: '/orders', label: '발주', mobileLabel: '발주', icon: 'box' },
  { to: '/expenses', label: '지출관리', mobileLabel: '지출', feature: F.EXPENSES_VIEW, icon: 'wallet' },
  { to: '/ai-assistant', label: 'AI비서', mobileLabel: 'AI비서', feature: F.AI_ASSISTANT, icon: 'sparkle' },
  { to: '/team', label: '팀관리', mobileLabel: '팀', icon: 'users' },
  { to: '/lounge', label: '라운지', mobileLabel: '라운지', icon: 'chat' },
  { to: '/settings', label: '설정', mobileLabel: '설정', icon: 'gear' },
];

// 단색 라인 아이콘 (heroicons 스타일, 24x24, currentColor)
function NavIcon({ name, className = 'w-5 h-5' }) {
  const common = { className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'home':
      return <svg {...common}><path d="M3 11l9-8 9 8" /><path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" /></svg>;
    case 'calendar':
      return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>;
    case 'folder':
      return <svg {...common}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>;
    case 'box':
      return <svg {...common}><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /><path d="M12 11v10" /></svg>;
    case 'wallet':
      return <svg {...common}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18" /><circle cx="16" cy="15" r="1.2" fill="currentColor" stroke="none" /></svg>;
    case 'sparkle':
      return <svg {...common}><path d="M12 3l1.8 4.5L18 9.3l-4.2 1.8L12 15.6l-1.8-4.5L6 9.3l4.2-1.8L12 3z" /><path d="M18.5 15.5l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8.8-1.8z" /></svg>;
    case 'users':
      return <svg {...common}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M15 20c0-2.8 2-5 4.5-5" /></svg>;
    case 'chat':
      return <svg {...common}><path d="M21 12a8 8 0 01-11.5 7.2L4 21l1.8-5.5A8 8 0 1121 12z" /></svg>;
    case 'gear':
      return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>;
    case 'more':
      return <svg {...common}><circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none" /></svg>;
    default:
      return null;
  }
}

export default function Layout() {
  const { auth, memberships, isAuthChecked, switchCompany, exitImpersonate, logout } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = !!auth?.isSuperAdmin;
  const isImpersonating = !!auth?.impersonating;
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  // 어드민이 일반 페이지 접근 시 /admin으로 자동 이동 (회사 컨텍스트 없을 수 있어서)
  // 일반 사용자가 /admin 접근 시 홈으로 자동 이동
  // isAuthChecked가 true가 된 뒤에만 결정 — 새로고침 직후 isSuperAdmin이 아직
  // 보강되지 않은 시점에 잘못 리다이렉트되는 것을 방지.
  // 어드민도 라운지는 일반 사용자와 동일한 화면 이용 가능 (모더레이션은 /admin 콘솔)
  const isLoungeRoute = location.pathname === '/lounge' || location.pathname.startsWith('/lounge/');
  useEffect(() => {
    if (!auth || !isAuthChecked) return;
    if (isAdmin && !isAdminRoute && !isLoungeRoute) {
      navigate('/admin', { replace: true });
    } else if (!isAdmin && isAdminRoute) {
      navigate('/', { replace: true });
    }
  }, [auth, isAuthChecked, isAdmin, isAdminRoute, isLoungeRoute, navigate]);

  // 일반회원(회사 없음)은 홈·라운지만 노출 — 회사 기능 메뉴는 숨김 (2026-05-14)
  const isGeneralMember = !isAdmin && !auth?.company;
  const navItems = isAdmin
    ? NAV.filter((n) => n.to === '/lounge')
    : isGeneralMember
    ? NAV.filter((n) => n.to === '/' || n.to === '/lounge')
    : NAV.filter((n) => !n.feature || canAccess(auth, n.feature));
  const hasMultipleCompanies = !isAdmin && (memberships?.length || 0) >= 2;

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

  function handleExitImpersonate() {
    if (exitImpersonate()) {
      navigate('/admin', { replace: true });
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      {isImpersonating && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2 text-sm flex items-center justify-between gap-3">
          <span>
            🎭 <b>{auth?.company?.name}</b>의 OWNER 화면을 보고 있습니다 (READ-ONLY · 1시간 자동 만료).
            데이터 변경은 차단됩니다.
          </span>
          <button
            onClick={handleExitImpersonate}
            className="text-xs px-3 py-1 bg-amber-900 text-amber-50 rounded hover:bg-amber-800 whitespace-nowrap"
          >
            🛡️ 어드민 콘솔로 돌아가기
          </button>
        </div>
      )}
      {auth && !isAdmin && <AnnouncementBanners />}
      <header className="bg-navy-800 text-white">
        <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
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
            <span className="hidden sm:inline-flex items-center gap-2">
              {isAdmin ? (
                <span className="text-violet-200">🛡️ 시스템 관리자</span>
              ) : (
                <>
                  {hasMultipleCompanies ? (
                    <CompanySwitcher
                      current={auth?.company}
                      memberships={memberships}
                      onSwitch={switchCompany}
                    />
                  ) : (
                    <span>{auth?.company?.name}</span>
                  )}
                  {auth?.company?.plan && <PlanBadge plan={auth.company.plan} />}
                </>
              )}
              <span>· {auth?.user?.name}</span>
            </span>
            <button
              onClick={() => { if (confirm('로그아웃 할까요?')) logout(); }}
              title="로그아웃"
              className="text-xs text-navy-100 hover:text-white px-2 py-1 rounded hover:bg-navy-700/60 transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-2 sm:px-4 py-4 sm:py-6">
        <Outlet />
      </main>

      <MobileBottomNav navItems={navItems} />

      <footer className="no-print border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 mb-[calc(env(safe-area-inset-bottom,0px)+64px)] sm:mb-0">
        <div className="max-w-[1400px] mx-auto px-4 py-3 sm:py-4 flex flex-col items-center gap-y-1 text-[11px] text-gray-400 dark:text-gray-500">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="font-semibold tracking-wide">SUPLEX</span>
            <span aria-hidden>·</span>
            <span>© {new Date().getFullYear()}</span>
            <span aria-hidden>·</span>
            <Link to="/terms" className="hover:text-navy-700 dark:hover:text-navy-300 hover:underline">이용약관</Link>
            <span aria-hidden>·</span>
            <Link to="/privacy" className="hover:text-navy-700 dark:hover:text-navy-300 hover:underline">개인정보처리방침</Link>
            <span aria-hidden>·</span>
            <a href="mailto:hello@suplex.kr" className="hover:text-navy-700 dark:hover:text-navy-300 hover:underline">hello@suplex.kr</a>
            <span aria-hidden>·</span>
            <a href="https://instagram.com/suplex.kr" target="_blank" rel="noopener noreferrer" className="hover:text-navy-700 dark:hover:text-navy-300 hover:underline">@suplex.kr</a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span>사업자 491-86-04017</span>
            <span aria-hidden>·</span>
            <span>법인 140111-0012507</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 활성 시스템 공지 배너 — 모든 일반 사용자 (어드민/사칭 시 미노출)
// 사용자별 dismiss는 sessionStorage 사용 — 새 세션엔 다시 노출
function AnnouncementBanners() {
  const { data } = useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: () => announcementsApi.active(),
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
  const [dismissed, setDismissed] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('suplex_announcements_dismissed') || '[]'); }
    catch { return []; }
  });
  function dismiss(id) {
    const next = [...dismissed, id];
    setDismissed(next);
    sessionStorage.setItem('suplex_announcements_dismissed', JSON.stringify(next));
  }
  const visible = (data?.announcements || []).filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;
  const palette = {
    info:  'bg-navy-50 text-navy-900 border-b border-navy-200',
    warn:  'bg-amber-50 text-amber-950 border-b border-amber-300',
    alert: 'bg-rose-50 text-rose-900 border-b border-rose-300',
  };
  return (
    <>
      {visible.map((a) => (
        <div key={a.id} className={`${palette[a.level] || palette.info} px-4 py-2 text-sm flex items-start justify-between gap-3`}>
          <div className="flex-1 min-w-0">
            <div className="font-semibold">{a.title}</div>
            {a.body && <div className="text-xs mt-0.5 whitespace-pre-line opacity-90">{a.body}</div>}
          </div>
          <button
            onClick={() => dismiss(a.id)}
            className="text-xs px-2 py-1 rounded hover:bg-black/10 whitespace-nowrap"
            title="이번 세션에서 숨김"
          >✕</button>
        </div>
      ))}
    </>
  );
}

// 모바일 하단 네비게이션 바 — 4개 primary 탭 + 더보기 시트 (메뉴 5개 이하면 더보기 없이 등분)
function MobileBottomNav({ navItems }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  // 라우트 바뀌면 시트 자동 닫기
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  if (navItems.length === 0) return null;

  const PRIMARY_MAX = 4;
  const needsMore = navItems.length > 5;
  const primary = needsMore ? navItems.slice(0, PRIMARY_MAX) : navItems;
  const overflow = needsMore ? navItems.slice(PRIMARY_MAX) : [];
  const totalCols = primary.length + (needsMore ? 1 : 0);
  const overflowActive = overflow.some((n) => location.pathname === n.to || (n.to !== '/' && location.pathname.startsWith(n.to + '/')));

  const tabBase = 'flex flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium select-none';
  const activeColor = 'text-white';
  const inactiveColor = 'text-navy-200';

  return (
    <>
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-navy-800 border-t border-navy-700 grid pb-[env(safe-area-inset-bottom,0px)]"
        style={{ gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` }}
      >
        {primary.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.exact}
            className={({ isActive }) => `${tabBase} ${isActive ? activeColor : inactiveColor} active:bg-navy-700/60`}
          >
            <NavIcon name={n.icon} />
            <span className="truncate max-w-full px-1">{n.mobileLabel || n.label}</span>
          </NavLink>
        ))}
        {needsMore && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`${tabBase} ${overflowActive ? activeColor : inactiveColor} active:bg-navy-700/60`}
          >
            <NavIcon name="more" />
            <span>더보기</span>
          </button>
        )}
      </nav>

      {moreOpen && (
        <>
          <div
            className="sm:hidden fixed inset-0 z-50 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl pb-[calc(env(safe-area-inset-bottom,0px)+16px)] animate-[slideUp_0.18s_ease-out]">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-slate-700" />
            </div>
            <div className="px-4 pt-2 pb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-navy-800 dark:text-navy-200">더보기</div>
              <button
                onClick={() => setMoreOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-sm px-2 py-1"
                aria-label="닫기"
              >✕</button>
            </div>
            <div className="grid grid-cols-4 gap-2 px-4 pb-3">
              {overflow.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  end={n.exact}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-[11px] ${
                      isActive
                        ? 'bg-navy-50 dark:bg-slate-800 text-navy-700 dark:text-navy-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`
                  }
                >
                  <NavIcon name={n.icon} className="w-6 h-6" />
                  <span className="truncate max-w-full px-1">{n.mobileLabel || n.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
          <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
        </>
      )}
    </>
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
