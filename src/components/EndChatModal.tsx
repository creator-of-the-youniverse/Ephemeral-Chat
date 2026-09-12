import React from 'react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4 text-left">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-semibold text-zinc-100">
            End your side of this conversation?
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            You will no longer be able to send messages. The other participant may still have their side of the conversation until they also end the chat.
          </p>
          <p className="text-xs text-rose-400/90 font-medium">
            Once both sides have ended, all messages and room data will be permanently destroyed.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={() => {
              onConfirmEnd();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition shadow-lg shadow-rose-600/20 active:scale-[0.98] cursor-pointer"
          >
            End My Side
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition cursor-pointer"
          >
            Stay in Chat
          </button>
        </div>
      </div>
    </div>
  );
};
