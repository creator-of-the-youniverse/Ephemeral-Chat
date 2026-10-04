/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Safe Storage Helpers
 * Prevents SecurityError or QuotaExceededError crashes in sandboxed iframes,
 * private browsing, or restrictive standalone webviews.
 */

export function safeGetLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetLocalStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveLocalStorage(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function safeGetSessionStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSetSessionStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveSessionStorage(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
