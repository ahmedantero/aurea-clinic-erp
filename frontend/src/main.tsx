import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { ThemeProvider } from './context/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'

// Global Auth Header Interceptor for Seamless Audit Trail & Token Injection
if (typeof window !== 'undefined' && window.fetch) {
  const nativeFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const config: RequestInit = init ? { ...init } : {};
    const headers = new Headers(config.headers || {});

    try {
      const saved = localStorage.getItem('aurea_auth_user');
      if (saved) {
        const authUser = JSON.parse(saved);
        if (authUser) {
          if (authUser.token && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${authUser.token}`);
          } else if (authUser.id && !headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${authUser.id}`);
          }
          if (authUser.id && !headers.has('x-user-id')) {
            headers.set('x-user-id', authUser.id);
          }
        }
      }
    } catch {}

    config.headers = headers;
    return nativeFetch(input, config);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
