/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Deferred PWA Service Worker Registration
 * Runs strictly after the initial React render and first paint are complete
 * using requestIdleCallback to prevent main-thread contention on startup.
 */

import { registerSW } from 'virtual:pwa-register';

let hasRegistered = false;

export function registerAppServiceWorker(): void {
  if (hasRegistered) return;
  hasRegistered = true;

  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const runRegistration = () => {
    if (import.meta.env.PROD) {
      try {
        registerSW({
          immediate: false,
          onNeedRefresh() {
            console.log('PrivaChat update available.');
          },
          onOfflineReady() {
            console.log('PrivaChat is ready for offline use.');
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
  };

  // Ensure registration runs when the browser's main thread is completely idle
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      runRegistration();
    }, { timeout: 2000 });
  } else {
    setTimeout(runRegistration, 800);
  }
}
