import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface EndChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnd: () => void;
  isHost: boolean;
  otherName: string;
}

export const EndChatModal: React.FC<EndChatModalProps> = ({
  isOpen,
  onClose,
  onConfirmEnd,
  otherName,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    confirmBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-chat-title"
        aria-describedby="end-chat-desc"
        className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center" aria-hidden="true">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            aria-label="Close dialog without ending"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-1.5" id="end-chat-desc">
          <h2 id="end-chat-title" className="text-lg font-semibold text-zinc-100">
            End your side of this conversation?
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            You will no longer be able to send messages. {otherName} may still see their side of the conversation until they also end the chat.
          </p>
          <p className="text-xs text-rose-400/90 font-medium">
            Once both sides have ended, all messages and room data will be permanently destroyed.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            ref={confirmBtnRef}
            onClick={() => {
              onConfirmEnd();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition shadow-lg shadow-rose-600/20 active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:outline-none"
          >
            End My Side
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
          >
            Stay in Chat
          </button>
        </div>
      </div>
    </div>
  );
};
