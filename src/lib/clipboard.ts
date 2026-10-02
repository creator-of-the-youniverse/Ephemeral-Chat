/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Safe cross-platform clipboard copy helper with fallbacks for iframes,
 * unfocused documents, and browser permissions.
 */

export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Attempt to focus the window first to satisfy document focus requirements
  if (typeof window.focus === 'function') {
    try {
      window.focus();
    } catch {
      // ignore
    }
  }

  // 1. Try modern navigator.clipboard if available
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err: any) {
      // Gracefully catch "Document is not focused", SecurityError, etc.
      console.warn('navigator.clipboard.writeText failed, attempting execCommand fallback:', err?.message || err);
    }
  }

  // 2. Fallback to hidden textarea with document.execCommand('copy')
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.style.opacity = '0.01';
    textArea.style.pointerEvents = 'none';
    textArea.setAttribute('tabindex', '-1');
    textArea.setAttribute('aria-hidden', 'true');

    document.body.appendChild(textArea);
    textArea.focus({ preventScroll: true });
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (fallbackErr) {
    console.warn('execCommand copy fallback failed:', fallbackErr);
    return false;
  }
}
