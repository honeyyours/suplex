import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'suplex_token';
const USER_KEY = 'suplex_user';
const LEGACY_TOKEN_KEY = 'splex_token';
const LEGACY_USER_KEY = 'splex_user';
// 사칭(impersonation) 시 어드민 토큰을 백업해두는 키 (사칭 종료 시 복구용)
const IMPERSONATE_BACKUP_KEY = 'suplex_admin_backup';

function readStored() {
  let token = localStorage.getItem(TOKEN_KEY);
  let user = localStorage.getItem(USER_KEY);
  if (!token || !user) {
    const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
    const legacyUser = localStorage.getItem(LEGACY_USER_KEY);
    if (legacyToken && legacyUser) {
      localStorage.setItem(TOKEN_KEY, legacyToken);
      localStorage.setItem(USER_KEY, legacyUser);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
      localStorage.removeItem(LEGACY_USER_KEY);
      token = legacyToken;
      user = legacyUser;
    }
  }
  return token && user ? { token, ...JSON.parse(user) } : null;
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored);
  const [memberships, setMemberships] = useState([]); // 다중 회사 전환용

  useEffect(() => {
    if (auth) {
      localStorage.setItem(TOKEN_KEY, auth.token);
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({ user: auth.user, company: auth.company, role: auth.role })
      );
    }
  }, [auth]);

  // 로그인 상태가 바뀌면 멤버십 목록 다시 로드 (회사 전환 드롭다운에 사용)
  useEffect(() => {
    if (!auth?.token) {
      setMemberships([]);
      return;
    }
    let alive = true;
    api.get('/auth/me').then((r) => {
      if (alive) setMemberships(r.data?.memberships || []);
    }).catch(() => { /* 401 등은 client.js interceptor가 처리 */ });
    return () => { alive = false; };
  }, [auth?.token, auth?.company?.id]);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    setAuth(data);
    return data;
  }

  async function signup(payload) {
    const { data } = await api.post('/auth/signup', payload);
    setAuth(data);
    return data;
  }

  async function acceptInvite(payload) {
    const { data } = await api.post('/invitations/accept', payload);
    setAuth(data);
    return data;
  }

  // 다른 회사로 전환 (memberships에 있는 회사만)
  async function switchCompany(companyId) {
    const { data } = await api.post('/auth/switch-company', { companyId });
    setAuth(data);
    return data;
  }

  // 이미 로그인된 유저가 초대 받아 합류 (자동으로 새 회사로 전환)
  async function joinByInvite(token) {
    const { data } = await api.post('/invitations/join', { token });
    setAuth(data);
    return data;
  }

  // 어드민이 회사 OWNER로 임시 진입 (사칭). 1시간 만료 + READ-ONLY.
  async function startImpersonate(companyId) {
    if (!auth?.isSuperAdmin) throw new Error('어드민만 사용 가능합니다');
    // 현재 어드민 토큰 백업
    localStorage.setItem(IMPERSONATE_BACKUP_KEY, JSON.stringify({
      token: auth.token,
      user: auth.user,
      role: auth.role,
      isSuperAdmin: auth.isSuperAdmin,
      company: auth.company,
    }));
    const { data } = await api.post(`/admin/companies/${companyId}/impersonate`);
    setAuth(data);
    return data;
  }

  // 사칭 종료 → 백업한 어드민 토큰으로 복구
  function exitImpersonate() {
    const raw = localStorage.getItem(IMPERSONATE_BACKUP_KEY);
    if (!raw) return false;
    try {
      const backup = JSON.parse(raw);
      localStorage.removeItem(IMPERSONATE_BACKUP_KEY);
      setAuth(backup);
      return true;
    } catch (e) {
      localStorage.removeItem(IMPERSONATE_BACKUP_KEY);
      return false;
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_USER_KEY);
    setAuth(null);
  }

  async function updateMe(payload) {
    const { data } = await api.patch('/auth/me', payload);
    setAuth((prev) => prev ? { ...prev, user: { ...prev.user, ...data.user } } : prev);
    return data.user;
  }

  // 회사 단위 설정(hideExpenses 등)을 즉시 반영
  function patchCompany(patch) {
    setAuth((prev) => prev ? { ...prev, company: { ...prev.company, ...patch } } : prev);
  }

  return (
    <AuthContext.Provider value={{ auth, memberships, login, signup, acceptInvite, switchCompany, joinByInvite, startImpersonate, exitImpersonate, logout, updateMe, patchCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
