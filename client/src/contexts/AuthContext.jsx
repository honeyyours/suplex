import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'suplex_token';
const USER_KEY = 'suplex_user';
const LEGACY_TOKEN_KEY = 'splex_token';
const LEGACY_USER_KEY = 'splex_user';

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

  useEffect(() => {
    if (auth) {
      localStorage.setItem(TOKEN_KEY, auth.token);
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({ user: auth.user, company: auth.company, role: auth.role })
      );
    }
  }, [auth]);

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

  return (
    <AuthContext.Provider value={{ auth, login, signup, logout, updateMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
