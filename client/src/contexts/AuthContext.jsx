import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('splex_token');
    const user = localStorage.getItem('splex_user');
    return token && user ? { token, ...JSON.parse(user) } : null;
  });

  useEffect(() => {
    if (auth) {
      localStorage.setItem('splex_token', auth.token);
      localStorage.setItem(
        'splex_user',
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
    localStorage.removeItem('splex_token');
    localStorage.removeItem('splex_user');
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
