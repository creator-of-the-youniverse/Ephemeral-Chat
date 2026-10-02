import React from 'react';
import { Lock, DoorClosed, Shield, ShieldCheck, Timer, LogOut, Volume2, VolumeX, Eye, HelpCircle } from 'lucide-react';
import { RoomData, ConnectionState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  roomData: RoomData | null;
  connectionState: ConnectionState;
  role: 'host' | 'guest' | null;
  onOpenEndModal: () => void;
  onToggleLock?: () => void;
  isLocked?: boolean;
  onUpdateTimer?: (seconds: number) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenA11yModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomData,
  connectionState,
  role,
  onOpenEndModal,
  onToggleLock,
  soundEnabled,
  onToggleSound,
  onOpenA11yModal,
}) => {
  const isHost = role === 'host';
  const myName = isHost ? roomData?.hostName : roomData?.guestName;
  const otherName = isHost ? roomData?.guestName : roomData?.hostName;
  const isOtherConnected = isHost ? roomData?.guestConnected : roomData?.hostConnected;

  const connectionStatusText =
    connectionState === 'connected'
      ? 'Connected to secure chat server'
      : connectionState === 'reconnecting'
      ? 'Reconnecting to chat server...'
      : 'Disconnected from chat server';

  const peerStatusText = isOtherConnected
    ? `${otherName || 'Peer'} is currently active in the room`
    : `${otherName || 'Peer'} is away`;

  return (
    <header role="banner" className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md safe-top px-3 py-2.5 sm:px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        {/* Brand / Title & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-inner"
            aria-hidden="true"
          >
            <DoorClosed className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs sm:text-sm text-zinc-100 truncate">
                {roomData?.status === 'ACTIVE'
                  ? `${myName || 'You'} & ${otherName || 'Guest'}`
                  : 'Private Ephemeral Room'}
              </span>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                title="End-to-End Encrypted Ephemeral Chat"
              >
                <Lock className="w-2.5 h-2.5" aria-hidden="true" />
                <span>Encrypted • Ephemeral</span>
              </span>
            </div>

            {/* Connection & Presence Status with Full Accessible Text */}
            <div
              className="flex items-center gap-2 text-[11px] text-zinc-400"
              role="status"
              aria-label={`${connectionStatusText}. ${roomData?.status === 'ACTIVE' ? peerStatusText : ''}`}
            >
              <span className="flex items-center gap-1">
                {connectionState === 'connected' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                    <span className="text-emerald-400">Connected</span>
                  </>
                ) : connectionState === 'reconnecting' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
                    <span className="text-amber-400">Reconnecting...</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" aria-hidden="true" />
                    <span className="text-zinc-500">Offline</span>
                  </>
                )}
              </span>

              {roomData?.status === 'ACTIVE' && (
                <>
                  <span className="text-zinc-600" aria-hidden="true">•</span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOtherConnected ? 'bg-emerald-500' : 'bg-zinc-600'
                      }`}
                      aria-hidden="true"
                    />
                    <span className={isOtherConnected ? 'text-zinc-300' : 'text-zinc-500'}>
                      {otherName || 'Peer'} {isOtherConnected ? 'in room' : 'away'}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0" role="toolbar" aria-label="Room Controls">
          {/* Sound Cues Toggle Button */}
          <button
            onClick={onToggleSound}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title={`Sound Cues: ${soundEnabled ? 'Enabled' : 'Muted'} (Shortcut: Alt+S)`}
            aria-label={`Sound Cues: ${soundEnabled ? 'Enabled' : 'Muted'}. Press to toggle. Keyboard shortcut: Alt plus S.`}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-500" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>

          {/* Accessibility Guide Button */}
          <button
            onClick={onOpenA11yModal}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center gap-1 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            title="Blind & Screen Reader Accessibility Guide (Shortcut: Alt+A)"
            aria-label="Open Accessibility & Keyboard Shortcuts Guide. Keyboard shortcut: Alt plus A."
          >
            <Eye className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span className="hidden sm:inline">Accessibility</span>
          </button>

          <PWAInstallButton />

          {/* Privacy Screen Lock Button */}
          {onToggleLock && (
            <button
              onClick={onToggleLock}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
              title="Quick Privacy Shield Lock (Shortcut: Alt+L)"
              aria-label="Lock screen with Privacy Shield. Keyboard shortcut: Alt plus L."
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span className="hidden sm:inline">Shield</span>
            </button>
          )}

          {/* End Chat Button */}
          {roomData && (
            <button
              onClick={onOpenEndModal}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
              title="End conversation (Shortcut: Alt+E)"
              aria-label="End conversation dialog. Keyboard shortcut: Alt plus E."
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>End Chat</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
