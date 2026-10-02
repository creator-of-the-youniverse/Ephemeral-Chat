import { useEffect, useRef, useState, useCallback } from 'react';
import { isShakeEnabled, getShakeAction, ShakeAction } from '../lib/shake';
import { hapticShakeFeedback } from '../lib/haptic';
import { announce } from '../lib/announcer';
import { playDestruct, playAlert } from '../lib/sound';

interface UseDeviceShakeOptions {
  onEndChat: () => void;
  onClearHistory: () => void;
  onOpenEndModal: () => void;
  active: boolean; // only trigger when inside an active conversation
}

export function useDeviceShake({
  onEndChat,
  onClearHistory,
  onOpenEndModal,
  active,
}: UseDeviceShakeOptions) {
  const [shakeToast, setShakeToast] = useState<string | null>(null);
  const lastShakeTimeRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const lastYRef = useRef<number>(0);
  const lastZRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Trigger shake action
  const triggerShakeAction = useCallback((source: 'physical' | 'keyboard' = 'physical') => {
    const now = Date.now();
    if (now - lastShakeTimeRef.current < 1500) {
      return; // cooldown 1.5s
    }
    lastShakeTimeRef.current = now;

    if (!isShakeEnabled()) return;
    if (!active) return;

    // 1. Deliver tactile Haptic API feedback
    hapticShakeFeedback();

    // 2. Determine configured action
    const action = getShakeAction();

    if (action === 'end_chat') {
      playDestruct();
      const msg = source === 'physical'
        ? 'Device shake detected: Conversation ended and wiped immediately.'
        : 'Emergency trigger: Conversation ended and wiped.';
      announce(msg, 'assertive');
      setShakeToast(msg);
      setTimeout(() => setShakeToast(null), 3500);
      onEndChat();
    } else if (action === 'clear_history') {
      playDestruct();
      const msg = source === 'physical'
        ? 'Device shake detected: All message history wiped immediately.'
        : 'Emergency trigger: All message history wiped.';
      announce(msg, 'assertive');
      setShakeToast(msg);
      setTimeout(() => setShakeToast(null), 3500);
      onClearHistory();
    } else {
      // prompt_end
      playAlert();
      const msg = source === 'physical'
        ? 'Device shake detected: Opening end chat confirmation.'
        : 'Emergency trigger: Opening end chat confirmation.';
      announce(msg, 'assertive');
      setShakeToast(msg);
      setTimeout(() => setShakeToast(null), 3000);
      onOpenEndModal();
    }
  }, [active, onEndChat, onClearHistory, onOpenEndModal]);

  // Motion event listener
  useEffect(() => {
    if (!active) return;

    const handleMotion = (event: DeviceMotionEvent) => {
      if (!isShakeEnabled()) return;

      const current = event.accelerationIncludingGravity || event.acceleration;
      if (!current) return;

      const now = Date.now();
      if (now - lastTimeRef.current < 80) return; // Sample at ~12Hz

      const x = current.x ?? 0;
      const y = current.y ?? 0;
      const z = current.z ?? 0;

      const deltaX = Math.abs(x - lastXRef.current);
      const deltaY = Math.abs(y - lastYRef.current);
      const deltaZ = Math.abs(z - lastZRef.current);

      lastXRef.current = x;
      lastYRef.current = y;
      lastZRef.current = z;
      lastTimeRef.current = now;

      // Calculate total acceleration change magnitude
      const totalDelta = deltaX + deltaY + deltaZ;

      // Deliberate physical shake threshold (around 26 - 30 m/s^2 total delta)
      if (totalDelta > 27) {
        triggerShakeAction('physical');
      }
    };

    window.addEventListener('devicemotion', handleMotion, { passive: true });
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [active, triggerShakeAction]);

  // Keyboard shortcut fallback for desktop testing / accessibility (Alt + K)
  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        triggerShakeAction('keyboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, triggerShakeAction]);

  return {
    shakeToast,
    triggerManualShake: () => triggerShakeAction('keyboard'),
  };
}
