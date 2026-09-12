import React from 'react';
import { Trash2, ShieldCheck, ArrowRight, DoorClosed } from 'lucide-react';

interface DestroyedNoticeProps {
  onStartNew: () => void;
  message?: string;
  isExpiredOrNonExistent?: boolean;
}

export const DestroyedNotice: React.FC<DestroyedNoticeProps> = ({
  onStartNew,
  message,
  isExpiredOrNonExistent,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-md mx-auto w-full my-auto text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shadow-2xl">
        {isExpiredOrNonExistent ? (
          <DoorClosed className="w-10 h-10 text-zinc-500" />
        ) : (
          <Trash2 className="w-10 h-10 text-rose-400" />
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">
          {message || 'The private room has been permanently destroyed.'}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xs mx-auto leading-relaxed">
          {isExpiredOrNonExistent
            ? 'This link is no longer valid. Ephemeral rooms are destroyed when completed.'
            : 'Both sides of the conversation have concluded. All messages, invitations, and session records have been wiped with zero recoverable history.'}
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-center gap-2 max-w-xs w-full">
        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span>Cryptographic wipe confirmed • 0 messages retained</span>
      </div>

      <button
        onClick={onStartNew}
        className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer"
      >
        <span>Start a New Chat</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
