import React, { useState, useEffect, useRef } from 'react';
import { X, Shield, Clock, EyeOff, AlertTriangle } from 'lucide-react';
import { Message } from '../types';
import { announce } from '../lib/announcer';
import { playDestruct } from '../lib/sound';

interface EphemeralImageModalProps {
  message: Message | null;
  onClose: () => void;
  onDestroyMessage: (messageId: string) => void;
  role: 'host' | 'guest';
}

export const EphemeralImageModal: React.FC<EphemeralImageModalProps> = ({
  message,
  onClose,
  onDestroyMessage,
  role,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Announce opening and handle Escape key
  useEffect(() => {
    if (!message) return;

    closeButtonRef.current?.focus();

    const desc = message.text ? `Photo description: ${message.text}.` : 'An ephemeral camera photo.';
    const viewOnceNotice = message.viewOnce ? ' Warning: This photo is view once and will dissolve when closed.' : '';
    announce(`Opened photo viewer. ${desc}${viewOnceNotice}`, 'polite');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [message]);

  useEffect(() => {
    if (!message) return;

    // If message is view-once and opened by recipient, schedule auto-destruction after 10s of viewing
    if (message.viewOnce && message.sender !== role) {
      const timer = setTimeout(() => {
        playDestruct();
        onDestroyMessage(message.id);
        onClose();
        announce('View-once photo time expired and dissolved.', 'assertive');
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [message, role]);

  useEffect(() => {
    if (!message?.expiresAt) {
      setSecondsRemaining(null);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, Math.ceil((message.expiresAt! - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        onClose();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [message]);

  if (!message || !message.imageData) return null;

  const isMe = message.sender === role;

  const handleClose = () => {
    // If view-once and recipient closes it, destroy it permanently
    if (message.viewOnce && !isMe) {
      playDestruct();
      onDestroyMessage(message.id);
      announce('View-once photo closed and permanently dissolved.', 'polite');
    }
    onClose();
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-3 sm:p-6 animate-fade-in select-none"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ephemeral photo viewer${message.text ? `: ${message.text}` : ''}`}
        className="relative w-full h-full flex flex-col items-center justify-center"
      >
        {/* Top action bar */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-700/60 text-emerald-400 text-xs font-mono">
              <Shield className="w-3.5 h-3.5" aria-hidden="true" />
              <span>End-to-End Decrypted</span>
            </div>

            {message.viewOnce && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono">
                <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
                <span>View Once</span>
              </div>
            )}

            {secondsRemaining !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-mono">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Destructs in {secondsRemaining}s</span>
              </div>
            )}
          </div>

          <button
            ref={closeButtonRef}
            onClick={handleClose}
            className="w-10 h-10 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            title="Close photo (Escape)"
            aria-label="Close photo viewer (Escape)"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Main Image View */}
        <div className="relative max-w-4xl max-h-[85dvh] flex flex-col items-center justify-center">
          <img
            src={message.imageData}
            alt={message.text ? `Ephemeral photo: ${message.text}` : 'Ephemeral photo sent in private room'}
            className="max-h-[75dvh] w-auto max-w-full rounded-2xl shadow-2xl object-contain pointer-events-none select-none"
            onContextMenu={(e) => e.preventDefault()}
          />

          {message.text && (
            <div className="mt-3 px-4 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-200 text-xs sm:text-sm max-w-md text-center backdrop-blur-md">
              <span className="sr-only">Photo description: </span>
              {message.text}
            </div>
          )}

          {message.viewOnce && !isMe && (
            <div className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1" role="status">
              <AlertTriangle className="w-3 h-3" aria-hidden="true" />
              <span>This photo will permanently dissolve once closed.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
