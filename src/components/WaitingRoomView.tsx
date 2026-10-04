import React, { useState, useEffect } from 'react';
import { DoorClosed, User, ArrowRight, MessageSquare } from 'lucide-react';
import { RoomData } from '../types';
import { announce } from '../lib/announcer';

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

  // Extract optional note from URL hash or query
  const [inviteNote] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const msg = hashParams.get('msg');
        if (msg) return decodeURIComponent(msg);
      }
      const searchParams = new URLSearchParams(window.location.search);
      const qMsg = searchParams.get('msg');
      if (qMsg) return decodeURIComponent(qMsg);
    } catch {
      // ignore
    }
    return null;
  });

  const hostName = roomData?.hostName || 'Host';

  useEffect(() => {
    if (!hasKnocked) {
      const announcement = inviteNote
        ? `You have been invited to a private room hosted by ${hostName}. Note from ${hostName}: "${inviteNote}". Enter your display name and knock on the door to enter.`
        : `You have been invited to a private room hosted by ${hostName}. Enter your display name and knock on the door to enter.`;
      announce(announcement, 'polite');
    }
  }, [hasKnocked, hostName, inviteNote]);

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
      announce(`Knock sent to ${hostName}. Waiting for host to open the door.`, 'assertive');
    } catch (err: any) {
      setLocalError(err.message || 'Failed to knock on the door.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-md mx-auto w-full my-auto text-center space-y-6">
      {/* Visual Door Emblem */}
      <div className="relative inline-flex mx-auto" aria-hidden="true">
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

      {!hasKnocked ? (
        /* Step 1: Arrived at Waiting Room, choose name and Knock */
        <div className="w-full space-y-5 animate-fade-in text-left">
          <div className="text-center space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100">
              You've been invited to a private room
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Hosted by <span className="text-emerald-400 font-semibold">{hostName}</span>. Choose your name and knock to be admitted.
            </p>
          </div>

          {/* Opening Note from Host if present */}
          {inviteNote && (
            <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-emerald-500/30 text-left space-y-1 animate-fade-in shadow-lg shadow-emerald-500/5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Message from {hostName}</span>
              </span>
              <p className="text-xs text-zinc-200 leading-relaxed italic">
                "{inviteNote}"
              </p>
            </div>
          )}

          <form onSubmit={handleKnockSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <label htmlFor="guestNameInput" className="block text-xs font-medium text-zinc-300">
                Choose your display name:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500" aria-hidden="true">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="guestNameInput"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your display name"
                  maxLength={25}
                  required
                  aria-required="true"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 transition"
                />
              </div>
            </div>

            {(localError || error) && (
              <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {localError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !guestName.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm sm:text-base transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
              aria-label="Knock on the door to request entry"
            >
              {submitting ? (
                <span>Knocking...</span>
              ) : (
                <>
                  <span>Knock on the Door</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>

            <p className="text-[11px] text-zinc-500 text-center">
              Accessible design: Audio earcons and live announcements guide you when the door opens. Press <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[10px]">Alt+A</kbd> for accessibility options.
            </p>
          </form>
        </div>
      ) : knockDeclined ? (
        /* Host kept door closed */
        <div className="w-full space-y-4 animate-fade-in text-center" role="alert" aria-live="assertive">
          <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm space-y-1">
            <h2 className="font-semibold text-zinc-100 block">The door remains closed</h2>
            <p className="text-xs text-zinc-400">
              The host did not open the door at this time.
            </p>
          </div>

          <button
            onClick={() => onKnock(guestName)}
            className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            aria-label="Knock on the door again"
          >
            Knock Again
          </button>
        </div>
      ) : (
        /* Step 2: Knocked and waiting for Host to open the door */
        <div className="w-full space-y-4 text-center animate-fade-in" role="status" aria-live="polite">
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
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" aria-hidden="true" />
              <span>Doorbell signaled</span>
            </div>
            <p>
              Your knock has been delivered to {hostName}'s screen in real time with an audio alert. Once they click "Open the Door", you will enter the private chat automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
