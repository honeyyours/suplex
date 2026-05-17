import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { PhaseLabelsProvider } from './contexts/PhaseLabelsContext.jsx';
import { queryClient } from './lib/queryClient';
import './styles/index.css';

// Service worker 등록 — PWA installable 자격 충족. 캐싱 없음 (stale 위험 회피).
// HTTPS 또는 localhost에서만 등록 가능. dev 환경은 vite hot reload 충돌 방지로 prod 빌드에서만.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <PhaseLabelsProvider>
              <App />
            </PhaseLabelsProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
