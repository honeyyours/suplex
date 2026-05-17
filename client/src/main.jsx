import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { PlanGuideProvider } from './contexts/PlanGuideContext.jsx';
import { PhaseLabelsProvider } from './contexts/PhaseLabelsContext.jsx';
import { queryClient } from './lib/queryClient';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <PlanGuideProvider>
            <AuthProvider>
              <PhaseLabelsProvider>
                <App />
              </PhaseLabelsProvider>
            </AuthProvider>
          </PlanGuideProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
