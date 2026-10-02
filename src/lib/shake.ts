/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Device Shake Gesture Utility
 * Detects deliberate physical shaking of the phone/tablet to trigger
 * an immediate "End Chat" or "Clear History" panic wipe, confirmed via Haptic API.
 */

import { hapticShakeFeedback, triggerHaptic } from './haptic';

export type ShakeAction = 'end_chat' | 'clear_history' | 'prompt_end';

const SHAKE_ENABLED_KEY = 'privachat_shake_enabled';
const LEGACY_SHAKE_ENABLED_KEY = 'privchat_shake_enabled';

const SHAKE_ACTION_KEY = 'privachat_shake_action';
const LEGACY_SHAKE_ACTION_KEY = 'privchat_shake_action';

/**
 * Checks if shake gesture detection is enabled.
 * Defaults to true for immediate physical protection.
 */
export function isShakeEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const val = localStorage.getItem(SHAKE_ENABLED_KEY) ?? localStorage.getItem(LEGACY_SHAKE_ENABLED_KEY);
    if (val === null) return true;
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Updates shake gesture preference.
 */
export function setShakeEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHAKE_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Returns the configured action when a shake is detected.
 * Defaults to 'end_chat' (immediate two-sided termination).
 */
export function getShakeAction(): ShakeAction {
  if (typeof window === 'undefined') return 'end_chat';
  try {
    const action = localStorage.getItem(SHAKE_ACTION_KEY) ?? localStorage.getItem(LEGACY_SHAKE_ACTION_KEY);
    if (action === 'clear_history' || action === 'prompt_end' || action === 'end_chat') {
      return action as ShakeAction;
    }
    return 'end_chat';
  } catch {
    return 'end_chat';
  }
}

/**
 * Updates the configured shake action.
 */
export function setShakeAction(action: ShakeAction): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHAKE_ACTION_KEY, action);
  } catch {
    // ignore
  }
}

/**
 * Request DeviceMotionEvent permission if required (e.g. iOS 13+ Safari).
 */
export async function requestDeviceMotionPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const DeviceMotion = (window as any).DeviceMotionEvent;
  if (DeviceMotion && typeof DeviceMotion.requestPermission === 'function') {
    try {
      const response = await DeviceMotion.requestPermission();
      return response === 'granted';
    } catch {
      return false;
    }
  }

  // Not iOS or permission not required
  return true;
}

/**
 * Tests the shake haptic feedback pattern.
 */
export function testShakeHaptic(): void {
  hapticShakeFeedback();
}
