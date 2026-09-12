import React, { useState } from 'react';
import { DoorClosed, Shield, User, ArrowRight, Sparkles, Key, Zap } from 'lucide-react';

interface LandingViewProps {
  onCreateRoom: (hostName: string) => Promise<string>;
  isLoading?: boolean;
  error?: string | null;
}

export const LandingView: React.FC<LandingViewProps> = ({ onCreateRoom, isLoading, error }) => {
  const [step, setStep] = useState<'intro' | 'name'>('intro');
  const [hostName, setHostName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim()) {
      setFormError('Please enter your name.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await onCreateRoom(hostName.trim());
    } catch (err: any) {
      setFormError(err.message || 'Failed to open private room.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-lg mx-auto w-full text-center my-auto">
      {/* Visual Door Emblem */}
      <div className="relative mb-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/80 shadow-2xl flex items-center justify-center text-emerald-400">
          <DoorClosed className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs">
          <Key className="w-3 h-3" />
        </div>
      </div>

      {step === 'intro' ? (
        <div className="space-y-6 w-full animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-100">
              Private Ephemeral Chat
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-sm mx-auto leading-relaxed">
              A temporary room for two. No accounts, no records, and permanently wiped when both leave.
            </p>
          </div>

          {/* Core Guarantees Grid */}
          <div className="grid grid-cols-1 gap-2.5 text-left pt-2">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <DoorClosed className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-zinc-200 block">Knock to Enter</span>
                <span className="text-zinc-400">
                  Share a secret link. The other person knocks, and you explicitly let them in.
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-xs sm:text-sm">
                <span className="font-semibold text-zinc-200 block">Mutual Ephemeral Destruction</span>
                <span className="text-zinc-400">
                  When both participants end the chat, all messages and records vanish permanently.
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              onClick={() => setStep('name')}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm sm:text-base transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer"
            >
              <span>Open a Private Chat</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Name Choice Screen */
        <form onSubmit={handleSubmit} className="w-full space-y-5 animate-fade-in text-left">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">
              Choose your name
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              This is the name the other person will see.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="hostNameInput" className="block text-xs font-medium text-zinc-300">
              Your name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="hostNameInput"
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. Alex"
                maxLength={25}
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {(formError || error) && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {formError || error}
            </div>
          )}

          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={submitting || isLoading || !hostName.trim()}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm sm:text-base transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer"
            >
              {submitting || isLoading ? (
                <span>Opening room...</span>
              ) : (
                <>
                  <span>Enter Private Room</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep('intro')}
              className="w-full py-2.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
