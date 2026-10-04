import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Manage PWA service worker lifecycle
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    try {
      registerSW({
        immediate: true,
        onNeedRefresh() {
          console.log('PrivaChat update available.');
        },
        onOfflineReady() {
          console.log('PrivaChat ready offline.');
        },
      });
    } catch (err) {
      console.warn('PWA service worker registration notice:', err);
    }
  } else {
    // In development mode, unregister any stale service workers to prevent cached bundle conflicts
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch(() => {});
      }
    }).catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

