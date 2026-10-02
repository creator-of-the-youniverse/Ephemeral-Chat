/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Haptic Feedback Utility
 * Provides tactile vibration confirmations for button presses, message arrivals,
 * knocks, and room dissolution to empower screen reader and low-vision users.
 */

const HAPTIC_STORAGE_KEY = 'privachat_haptic_enabled';
const LEGACY_HAPTIC_STORAGE_KEY = 'privchat_haptic_enabled';

/**
 * Checks if haptic feedback is enabled in local storage.
 * Defaults to true for tactile accessibility.
 */
export function isHapticEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(HAPTIC_STORAGE_KEY) ?? localStorage.getItem(LEGACY_HAPTIC_STORAGE_KEY);
    if (stored === null) return true; // default enabled
    return stored === 'true';
  } catch {
    return true;
  }
}

/**
 * Updates the haptic feedback preference in storage.
 */
export function setHapticEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HAPTIC_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Safe executor for navigator.vibrate
 */
export function triggerHaptic(pattern: number | number[]): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  if (!isHapticEnabled()) return false;

  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      return navigator.vibrate(pattern);
    }
  } catch (err) {
    // Vibration can be ignored if page is not active or permissions disallow
  }
  return false;
}

/**
 * Short subtle tactile tick for button taps, switches, and menu items (12-15ms)
 */
export function hapticTap(): void {
  triggerHaptic(15);
}

/**
 * Distinct double-pulse for incoming message or temporary photo received
 */
export function hapticMessageReceived(): void {
  triggerHaptic([35, 45, 45]);
}

/**
 * Crisp ascending confirmation tick when sending a message or photo
 */
export function hapticMessageSent(): void {
  triggerHaptic([15, 30, 25]);
}

/**
 * Rhythmic physical knock pattern when a guest knocks at the door
 */
export function hapticKnock(): void {
  triggerHaptic([50, 70, 70]);
}

/**
 * Entrance unlocked / door opened tactile cue
 */
export function hapticDoorOpen(): void {
  triggerHaptic([30, 30, 60]);
}

/**
 * Camera shutter tactile snap
 */
export function hapticShutter(): void {
  triggerHaptic(40);
}

/**
 * Tactile pattern for message dissolution, room destruction, or chat ending
 */
export function hapticDestruct(): void {
  triggerHaptic([60, 40, 60, 40, 90]);
}

/**
 * Distinct, urgent triple vibration burst confirming a physical device shake
 * gesture has been detected to end chat or clear history.
 */
export function hapticShakeFeedback(): void {
  triggerHaptic([80, 50, 80, 50, 160]);
}

/**
 * Attaches a lightweight global click listener so any interactive button,
 * role="button", or role="switch" delivers subtle tactile feedback automatically.
 */
let isListenerAttached = false;
export function setupGlobalButtonHaptics(): void {
  if (typeof window === 'undefined' || isListenerAttached) return;
  isListenerAttached = true;

  window.addEventListener(
    'click',
    (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest<HTMLElement>(
        'button, [role="button"], [role="switch"], [role="menuitem"], [role="menuitemradio"], input[type="submit"]'
      );

      if (interactive && !interactive.hasAttribute('disabled')) {
        hapticTap();
      }
    },
    { capture: true, passive: true }
  );
}

// Automatically initialize global listener
if (typeof window !== 'undefined') {
  setupGlobalButtonHaptics();
}
