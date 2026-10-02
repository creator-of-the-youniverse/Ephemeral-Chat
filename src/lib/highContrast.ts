/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * High Contrast Mode Accessibility Manager
 * Adjusts color palette to pure white (#ffffff) on deep black (#000000)
 * with thick borders and high-visibility focus indicators.
 */

const HIGH_CONTRAST_STORAGE_KEY = 'privchat_high_contrast';

export function isHighContrastEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(HIGH_CONTRAST_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setHighContrastEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HIGH_CONTRAST_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
  applyHighContrastTheme(enabled);
}

export function applyHighContrastTheme(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  if (enabled) {
    document.documentElement.classList.add('high-contrast');
  } else {
    document.documentElement.classList.remove('high-contrast');
  }
}

// Automatically apply saved setting upon initial load
if (typeof window !== 'undefined') {
  try {
    if (isHighContrastEnabled()) {
      applyHighContrastTheme(true);
    }
  } catch {
    // ignore
  }
}
