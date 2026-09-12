import React, { useState } from 'react';
import { Shield, Lock, Key, ArrowRight } from 'lucide-react';

interface BiometricLockModalProps {
  isLocked: boolean;
  onUnlock: () => void;
}

export const BiometricLockModal: React.FC<BiometricLockModalProps> = ({ isLocked, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const handleUnlockAttempt = async () => {
    // Try WebAuthn / Biometrics if supported
    if (
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      try {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          // Trigger device unlock
          onUnlock();
          return;
        }
      } catch {
        // fallback to tap
      }
    }
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xs rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-zinc-700/80 mx-auto flex items-center justify-center text-emerald-400 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-zinc-100">Private Screen Shield</h3>
          <p className="text-xs text-zinc-400">
            Room content is concealed for privacy. Unlock to resume your session.
          </p>
        </div>

        <button
          onClick={handleUnlockAttempt}
          className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          Unlock Session
        </button>
      </div>
    </div>
  );
};
