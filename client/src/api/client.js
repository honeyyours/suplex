import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('suplex_token') || localStorage.getItem('splex_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('suplex_token');
      localStorage.removeItem('suplex_user');
      localStorage.removeItem('splex_token');
      localStorage.removeItem('splex_user');
      localStorage.removeItem('suplex_admin_backup'); // 사칭 백업도 같이 정리
      // 토큰 만료/무효화 시 로그인으로 자동 이동.
      // 단, 로그인/가입/초대 등 public 페이지에 있을 땐 그대로 (무한 루프 방지).
      const path = window.location.pathname;
      const publicRoutes = ['/login', '/signup', '/invite'];
      const isPublic = publicRoutes.some((p) => path === p || path.startsWith(p + '/'));
      if (!isPublic) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
