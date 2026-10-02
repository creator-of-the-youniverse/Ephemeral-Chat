import { useState, useEffect, useRef } from 'react';
import { announce } from '../lib/announcer';
import { playDoorKnock } from '../lib/sound';
import { triggerHaptic } from '../lib/haptic';

export interface BatteryState {
  isSupported: boolean;
  level: number; // 0 to 100
  charging: boolean;
  isLow: boolean; // level <= 20 and !charging
}

const SIMULATED_BATTERY_KEY = 'privachat_simulated_battery';

export function simulateBatteryLevel(level: number | null): void {
  if (typeof window === 'undefined') return;
  if (level === null) {
    localStorage.removeItem(SIMULATED_BATTERY_KEY);
    window.dispatchEvent(new CustomEvent('privachat:battery-change', { detail: null }));
  } else {
    localStorage.setItem(SIMULATED_BATTERY_KEY, String(level));
    window.dispatchEvent(new CustomEvent('privachat:battery-change', { detail: { level, charging: false } }));
  }
}

export function useBattery(): BatteryState {
  const [batteryState, setBatteryState] = useState<BatteryState>(() => {
    if (typeof window !== 'undefined') {
      const simulated = localStorage.getItem(SIMULATED_BATTERY_KEY);
      if (simulated !== null) {
        const level = parseInt(simulated, 10);
        if (!isNaN(level)) {
          return {
            isSupported: true,
            level,
            charging: false,
            isLow: level <= 20,
          };
        }
      }
    }
    return {
      isSupported: false,
      level: 100,
      charging: true,
      isLow: false,
    };
  });

  const hasWarnedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let batteryManager: any = null;

    const applyState = (level: number, charging: boolean, supported: boolean) => {
      if (!isMounted) return;
      const isLow = level <= 20 && !charging;
      setBatteryState({
        isSupported: supported,
        level,
        charging,
        isLow,
      });

      if (isLow && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        try {
          playDoorKnock();
          triggerHaptic([100, 60, 150]);
        } catch {
          // ignore
        }
        announce(
          `Warning: Device battery is at ${level} percent. Please connect a charger to prevent sudden mid-chat disconnection.`,
          'assertive'
        );
      } else if (!isLow) {
        hasWarnedRef.current = false;
      }
    };

    const handleSimulationEvent = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        applyState(custom.detail.level, custom.detail.charging ?? false, true);
      } else {
        // Re-check hardware battery
        initHardwareBattery();
      }
    };

    window.addEventListener('privachat:battery-change', handleSimulationEvent);

    const initHardwareBattery = () => {
      const simulated = localStorage.getItem(SIMULATED_BATTERY_KEY);
      if (simulated !== null) {
        const level = parseInt(simulated, 10);
        if (!isNaN(level)) {
          applyState(level, false, true);
          return;
        }
      }

      const nav = navigator as any;
      if (typeof nav !== 'undefined' && typeof nav.getBattery === 'function') {
        nav.getBattery().then((battery: any) => {
          if (!isMounted) return;
          batteryManager = battery;
          const readBattery = () => {
            const level = Math.round((battery.level ?? 1) * 100);
            applyState(level, Boolean(battery.charging), true);
          };

          readBattery();
          battery.addEventListener('levelchange', readBattery);
          battery.addEventListener('chargingchange', readBattery);
        }).catch(() => {
          // Hardware API unavailable
        });
      }
    };

    initHardwareBattery();

    return () => {
      isMounted = false;
      window.removeEventListener('privachat:battery-change', handleSimulationEvent);
      if (batteryManager) {
        try {
          batteryManager.removeEventListener('levelchange', () => {});
          batteryManager.removeEventListener('chargingchange', () => {});
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return batteryState;
}
