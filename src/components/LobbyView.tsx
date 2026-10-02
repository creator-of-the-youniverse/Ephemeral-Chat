import React, { useState, useEffect, useRef } from 'react';
import { Share2, Copy, Check, DoorOpen, Bell, MessageSquare, Edit3 } from 'lucide-react';
import { RoomData } from '../types';
import { announce } from '../lib/announcer';
import { speakVoicePrompt } from '../lib/speech';
import { copyToClipboard } from '../lib/clipboard';

interface LobbyViewProps {
  roomId: string;
  roomData: RoomData | null;
  guestKnocked: { guestName: string } | null;
  draftMessage?: string;
  onUpdateDraftMessage?: (msg: string) => void;
  onOpenDoor: () => void;
  onKeepDoorClosed: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomId,
  roomData,
  guestKnocked,
  draftMessage = '',
  onUpdateDraftMessage,
  onOpenDoor,
  onKeepDoorClosed,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLinkOnly, setCopiedLinkOnly] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const openDoorBtnRef = useRef<HTMLButtonElement | null>(null);

  // Unpredictable random invite URL
  const baseInviteUrl = `${window.location.origin}/chat/${roomId}`;
  const inviteUrlWithNote = draftMessage.trim()
    ? `${baseInviteUrl}#msg=${encodeURIComponent(draftMessage.trim())}`
    : baseInviteUrl;

  // Announce waiting status on mount
  useEffect(() => {
    if (!guestKnocked) {
      announce(
        'Your private room is ready. Copy or share the temporary invite link. When your friend knocks, you will hear a double knock earcon and can open the door.',
        'polite'
      );
    }
  }, []);

  // When someone knocks, auto-focus the Open Door button for immediate keyboard/screen-reader action
  useEffect(() => {
    if (guestKnocked) {
      setTimeout(() => {
        openDoorBtnRef.current?.focus();
      }, 100);
    }
  }, [guestKnocked]);

  const handleShare = async () => {
    const shareText = draftMessage.trim()
      ? `${draftMessage.trim()}\n\nKnock on the door to enter: ${baseInviteUrl}`
      : 'Private ephemeral conversation room. Knock on the door to enter.';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join my private chat room',
          text: shareText,
          url: inviteUrlWithNote,
        });
        return;
      } catch (err: any) {
        // User deliberately cancelled the share dialog
        if (err && (err.name === 'AbortError' || err.name === 'CancelError')) {
          return;
        }
        // Fallback to copy
        await handleCopy();
      }
    } else {
      await handleCopy();
    }
  };

  const handleCopy = async () => {
    const textToCopy = draftMessage.trim()
      ? `"${draftMessage.trim()}"\n\nJoin my private room: ${inviteUrlWithNote}`
      : inviteUrlWithNote;

    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCopied(true);
      const msg = draftMessage.trim()
        ? 'Private room invite with your drafted message copied to clipboard.'
        : 'Private room link copied to clipboard.';
      announce(msg, 'polite');
      speakVoicePrompt(msg);
      setTimeout(() => setCopied(false), 2500);
    } else {
      const fallbackMsg = 'Room link selected. Press Control C or Command C to copy.';
      announce(fallbackMsg, 'polite');
    }
  };

  const handleCopyLinkOnly = async () => {
    const success = await copyToClipboard(inviteUrlWithNote);
    if (success) {
      setCopiedLinkOnly(true);
      const msg = 'Room link copied to clipboard.';
      announce(msg, 'polite');
      setTimeout(() => setCopiedLinkOnly(false), 2500);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-md mx-auto w-full my-auto space-y-5">
      {/* Prominent Knock Alert Card when User 2 is at the door */}
      {guestKnocked ? (
        <section
          role="region"
          aria-live="assertive"
          aria-label="Doorbell notification"
          className="w-full p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 animate-bounce-short text-left space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 animate-pulse" aria-hidden="true">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 block">
                🚪 Someone is at the door
              </span>
              <h2 className="text-lg font-semibold text-zinc-100">
                <span className="text-emerald-400 font-bold">{guestKnocked.guestName}</span> wants to join your private chat.
              </h2>
            </div>
          </div>

          <p className="text-xs text-zinc-400">
            This private room is exclusively for two. Only admit this person if you intended to invite them.
          </p>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              ref={openDoorBtnRef}
              onClick={onOpenDoor}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-[0.98] cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
              aria-label={`Open the door and admit ${guestKnocked.guestName} into the private chat`}
            >
              <DoorOpen className="w-4 h-4" aria-hidden="true" />
              <span>Open the Door</span>
            </button>

            <button
              onClick={onKeepDoorClosed}
              className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
              aria-label={`Keep door closed and decline ${guestKnocked.guestName}`}
            >
              Keep Door Closed
            </button>
          </div>
        </section>
      ) : (
        /* Waiting Lobby Screen */
        <div className="w-full space-y-5 text-center animate-fade-in">
          {/* Visual Door waiting state */}
          <div className="relative inline-flex mx-auto" aria-hidden="true">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-xl">
              <DoorOpen className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100">
              Your private room is ready
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Share the temporary link with your friend. When they knock, you will be notified to open the door.
            </p>
          </div>

          {/* Drafted Opening Message / Invite Note Card */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Opening Message & Invite Note</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                Pre-loaded in chat
              </span>
            </div>

            <textarea
              value={draftMessage}
              onChange={(e) => onUpdateDraftMessage?.(e.target.value)}
              placeholder="Draft a message to include with your invite link and send when chat opens..."
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950/70 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-400 transition resize-none leading-relaxed"
            />
            <p className="text-[11px] text-zinc-400 leading-tight">
              {draftMessage.trim()
                ? 'This note will be included when sharing your invite and ready in your chat when the door opens.'
                : 'Optional: Add an opening note to include in the invite preview.'}
            </p>
          </div>

          {/* Invitation Actions */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleShare}
              className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm sm:text-base transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
              aria-label="Share private room invitation link"
            >
              <Share2 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{draftMessage.trim() ? 'Share Invite with Message' : 'Share Private Invite'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800/90 border border-zinc-800 text-zinc-200 text-xs font-medium transition flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                aria-label="Copy private room invite to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span className="text-emerald-400 font-semibold">Invite Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
                    <span>{draftMessage.trim() ? 'Copy Invite with Note' : 'Copy Invite Link'}</span>
                  </>
                )}
              </button>

              {draftMessage.trim() && (
                <button
                  onClick={handleCopyLinkOnly}
                  className="py-2.5 px-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                  title="Copy link without note"
                  aria-label="Copy link only without note"
                >
                  {copiedLinkOnly ? (
                    <span className="text-emerald-400 font-semibold">Link Copied</span>
                  ) : (
                    <span>Link Only</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* URL Box */}
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-left">
            <span className="block text-[11px] uppercase font-mono text-zinc-500 tracking-wider mb-1">
              Temporary Room Link
            </span>
            <div
              role="button"
              tabIndex={0}
              onClick={handleCopy}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCopy();
                }
              }}
              title="Click or press Enter to copy room link"
              className="font-mono text-xs text-zinc-300 break-all select-all block cursor-pointer hover:text-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none rounded transition"
              aria-label={`Temporary Room Link: ${inviteUrlWithNote}. Click or press Enter to copy.`}
            >
              {inviteUrlWithNote}
            </div>
          </div>

          {/* Ambient Waiting Indicator */}
          <div className="pt-1 flex items-center justify-center gap-2 text-xs text-zinc-500" role="status" aria-live="polite">
            <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" aria-hidden="true" />
            <span>Waiting for the other person to knock...</span>
          </div>
        </div>
      )}
    </div>
  );
};
