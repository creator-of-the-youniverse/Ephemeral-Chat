import React from 'react';
import { Lock, DoorClosed, Shield, ShieldCheck, Timer, LogOut, Wifi, WifiOff } from 'lucide-react';
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
}

export const Header: React.FC<HeaderProps> = ({
  roomData,
  connectionState,
  role,
  onOpenEndModal,
  onToggleLock,
  onUpdateTimer,
}) => {
  const isHost = role === 'host';
  const myName = isHost ? roomData?.hostName : roomData?.guestName;
  const otherName = isHost ? roomData?.guestName : roomData?.hostName;
  const isOtherConnected = isHost ? roomData?.guestConnected : roomData?.hostConnected;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md safe-top px-3 py-2.5 sm:px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
        {/* Brand / Title & Status */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-inner">
            <DoorClosed className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-xs sm:text-sm text-zinc-100 truncate">
                {roomData?.status === 'ACTIVE'
                  ? `${myName || 'You'} + ${otherName || 'Guest'}`
                  : 'Private Room'}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="w-2.5 h-2.5" />
                <span>Private • Ephemeral</span>
              </span>
            </div>

            {/* Connection & Presence Status */}
            <div className="flex items-center gap-2 text-[11px] text-zinc-400">
              <span className="flex items-center gap-1">
                {connectionState === 'connected' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-400">Connected</span>
                  </>
                ) : connectionState === 'reconnecting' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-amber-400">Reconnecting...</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    <span className="text-zinc-500">Offline</span>
                  </>
                )}
              </span>

              {roomData?.status === 'ACTIVE' && (
                <>
                  <span className="text-zinc-600">•</span>
                  <span className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOtherConnected ? 'bg-emerald-500' : 'bg-zinc-600'
                      }`}
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
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <PWAInstallButton />

          {/* Privacy Screen Lock Button */}
          {onToggleLock && (
            <button
              onClick={onToggleLock}
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 transition cursor-pointer"
              title="Quick Privacy Shield Lock"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Shield</span>
            </button>
          )}

          {/* End Chat Button */}
          {roomData && (
            <button
              onClick={onOpenEndModal}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title="End conversation"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>End Chat</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
