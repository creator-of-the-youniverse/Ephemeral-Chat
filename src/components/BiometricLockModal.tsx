import React, { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';
import { playShieldToggle } from '../lib/sound';
import { announce } from '../lib/announcer';

interface BiometricLockModalProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export const BiometricLockModal: React.FC<BiometricLockModalProps> = ({ isLocked, onUnlock }) => {
  const unlockBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (isLocked) {
      playShieldToggle(true);
      announce('Privacy shield locked. Room content is concealed. Press Unlock Session to resume.', 'assertive');
      setTimeout(() => unlockBtnRef.current?.focus(), 100);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleUnlockAttempt = async () => {
    playShieldToggle(false);
    announce('Privacy shield unlocked. Room content visible.', 'polite');
    onUnlock();
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lock-modal-title"
        aria-describedby="lock-modal-desc"
        className="w-full max-w-xs rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-center space-y-4"
      >
        <div
          className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700/80 mx-auto flex items-center justify-center text-emerald-400 shadow-inner"
          aria-hidden="true"
        >
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h2 id="lock-modal-title" className="text-base font-semibold text-zinc-100">
            Private Screen Shield
          </h2>
          <p id="lock-modal-desc" className="text-xs text-zinc-400">
            Room content is concealed for privacy. Unlock to resume your session.
          </p>
        </div>

        <button
          ref={unlockBtnRef}
          onClick={handleUnlockAttempt}
          className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
          aria-label="Unlock Session and reveal private chat"
        >
          Unlock Session
        </button>
      </div>
    </div>
  );
};
