import React, { useState } from 'react';
import { DoorClosed, User, ArrowRight, Shield, AlertCircle, Download, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { RoomData } from '../types';

interface WaitingRoomViewProps {
  roomData: RoomData | null;
  onKnock: (guestName: string) => Promise<void>;
  hasKnocked: boolean;
  knockDeclined?: boolean;
  error?: string | null;
}

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({
  roomData,
  onKnock,
  hasKnocked,
  knockDeclined,
  error,
}) => {
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const handleKnockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setLocalError('Please enter your name to knock.');
      return;
    }
    setSubmitting(true);
    setLocalError(null);
    try {
      await onKnock(guestName.trim());
    } catch (err: any) {
      setLocalError(err.message || 'Failed to knock on the door.');
      setSubmitting(false);
    }
  };

  const hostName = roomData?.hostName || 'Host';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-md mx-auto w-full my-auto text-center space-y-6">
      {/* Visual Door Emblem */}
      <div className="relative inline-flex mx-auto">
        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-2xl transition-all duration-300 ${
            hasKnocked && !knockDeclined ? 'ring-4 ring-emerald-500/20' : ''
          }`}
        >
          <DoorClosed
            className={`w-10 h-10 sm:w-12 sm:h-12 ${
              hasKnocked && !knockDeclined ? 'animate-pulse' : ''
            }`}
          />
        </div>
      </div>

      {!isInstalled && (
        <div className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-left animate-fade-in">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-100">Install PrivChat</p>
              <p className="text-xs text-zinc-400 mt-0.5">Keep this private room one tap away.</p>
            </div>
            {isInstallable && (
              <button
                type="button"
                onClick={install}
                className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 transition-colors"
              >
                Install
              </button>
            )}
          </div>
          {isIOS && (
            <div className="mt-3 flex items-start gap-2 text-xs text-zinc-400">
              <Share className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
              <span>Tap Share, then <span className="text-zinc-200 font-medium">Add to Home Screen</span>.</span>
            </div>
          )}
        </div>
      )}

      {!hasKnocked ? (
        /* Step 1: Arrived at Waiting Room, choose name and Knock */
        <div className="w-full space-y-5 animate-fade-in text-left">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">
              You've been invited to a private room
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              Hosted by <span className="text-emerald-400 font-semibold">{hostName}</span>. Choose your name and knock to be admitted.
            </p>
          </div>

          <form onSubmit={handleKnockSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <label htmlFor="guestNameInput" className="block text-xs font-medium text-zinc-300">
                Choose your name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="guestNameInput"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your name"
                  maxLength={25}
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            {(localError || error) && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {localError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !guestName.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm sm:text-base transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer"
            >
              {submitting ? (
                <span>Knocking...</span>
              ) : (
                <>
                  <span>Knock on the Door</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      ) : knockDeclined ? (
        /* Host kept door closed */
        <div className="w-full space-y-4 animate-fade-in text-center">
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm space-y-1">
            <span className="font-semibold text-zinc-100 block">The door remains closed</span>
            <span className="text-xs text-zinc-400">
              The host did not open the door at this time.
            </span>
          </div>

          <button
            onClick={() => onKnock(guestName)}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition"
          >
            Knock Again
          </button>
        </div>
      ) : (
        /* Step 2: Knocked and waiting for Host to open the door */
        <div className="w-full space-y-4 text-center animate-fade-in">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-zinc-100 flex items-center justify-center gap-2">
              <span>Knock knock...</span>
            </h2>
            <p className="text-sm text-emerald-400 font-medium animate-pulse">
              Waiting for {hostName} to open the door.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs text-zinc-400 text-left space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Doorbell signaled</span>
            </div>
            <p>
              Your knock has been delivered to {hostName}'s screen in real time. Once they click "Open the Door", you will enter the private chat automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
