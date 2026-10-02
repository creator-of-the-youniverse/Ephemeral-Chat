import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  DoorClosed,
  ShieldCheck,
  LogOut,
  Volume2,
  VolumeX,
  Eye,
  MoreHorizontal,
  X,
  Battery,
  BatteryCharging,
  BatteryWarning,
  BatteryLow,
} from 'lucide-react';
import { RoomData, ConnectionState } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useBattery, simulateBatteryLevel } from '../hooks/useBattery';

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
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const battery = useBattery();

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

  // Close more menu on Escape
  useEffect(() => {
    if (!isMoreOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  return (
    <header role="banner" className="Header sticky top-0 z-30 w-full border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md safe-top px-3 py-2.5 sm:px-6">
      <div className="max-w-3xl mx-auto flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-3 gap-y-2">
        {/* Row 1 on Mobile / Left Section on Desktop: Participant Name & Emblem */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5 min-w-0 sm:flex-1">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div
              className="w-8.5 h-8.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-inner"
              aria-hidden="true"
            >
              <DoorClosed className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1">
              {/* Room Title & Security Indicator */}
              <div className="flex items-center gap-1.5 min-w-0">
                <h1
                  className="font-semibold text-xs sm:text-sm text-zinc-100 truncate tracking-tight"
                  title={
                    roomData?.status === 'ACTIVE'
                      ? `${myName || 'You'} & ${otherName || 'Guest'}`
                      : 'Private Ephemeral Room'
                  }
                >
                  {roomData?.status === 'ACTIVE'
                    ? `${myName || 'You'} & ${otherName || 'Guest'}`
                    : 'Private Ephemeral Room'}
                </h1>
                <span
                  title="End-to-End Encrypted Ephemeral Chat"
                  className="flex items-center text-emerald-400/95 flex-shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/25 text-[10px]"
                >
                  <Lock className="w-3 h-3 mr-0.5" aria-hidden="true" />
                  <span className="font-mono text-[9px] font-semibold sm:hidden">E2EE</span>
                  <span className="sr-only">End-to-end encrypted ephemeral room</span>
                </span>
              </div>

              {/* Desktop-only Connection & Presence Status under title */}
              <div
                className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-400 min-w-0 leading-tight pt-0.5"
                role="status"
                aria-label={`${connectionStatusText}. ${roomData?.status === 'ACTIVE' ? peerStatusText : ''}`}
              >
                <span className="flex items-center gap-1 flex-shrink-0">
                  {connectionState === 'connected' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                      <span className="text-emerald-400/90 font-medium">Connected</span>
                    </>
                  ) : connectionState === 'reconnecting' ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
                      <span className="text-amber-400 font-medium">Reconnecting...</span>
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
                    <span className="text-zinc-600 select-none" aria-hidden="true">·</span>
                    <span className="flex items-center gap-1 min-w-0 truncate">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          isOtherConnected ? 'bg-emerald-500' : 'bg-zinc-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span className={`truncate ${isOtherConnected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {otherName || 'Peer'} {isOtherConnected ? 'in room' : 'away'}
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile-only Quick Controls in Row 1 (Battery, Sound & More Options) */}
          <div className="flex sm:hidden items-center gap-1.5 flex-shrink-0">
            {/* Battery Status Indicator (Warns when device is below 20%) */}
            {battery.isSupported && (
              <div
                role="status"
                aria-label={
                  battery.isLow
                    ? `Low battery alert: ${battery.level}% remaining. Connect charger to prevent disconnection.`
                    : `Device battery: ${battery.level}%${battery.charging ? ', charging' : ''}`
                }
                title={
                  battery.isLow
                    ? `Warning: Battery at ${battery.level}%. Connect charger to prevent mid-chat disconnection!`
                    : `Battery: ${battery.level}%${battery.charging ? ' (Charging)' : ''}`
                }
                className={`min-h-[44px] px-2.5 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition select-none ${
                  battery.isLow
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold animate-pulse shadow-xs'
                    : battery.charging
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 font-medium'
                }`}
              >
                {battery.isLow ? (
                  <>
                    <BatteryWarning className="w-4 h-4 text-amber-400 flex-shrink-0 animate-bounce" aria-hidden="true" />
                    <span className="text-[11px] font-bold text-amber-200">{battery.level}%</span>
                  </>
                ) : battery.charging ? (
                  <>
                    <BatteryCharging className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-[11px] font-mono">{battery.level}%</span>
                  </>
                ) : (
                  <>
                    {battery.level <= 30 ? (
                      <BatteryLow className="w-4 h-4 text-amber-400/90 flex-shrink-0" aria-hidden="true" />
                    ) : (
                      <Battery className="w-4 h-4 text-zinc-400 flex-shrink-0" aria-hidden="true" />
                    )}
                    <span className="text-[11px] font-mono">{battery.level}%</span>
                  </>
                )}
              </div>
            )}

            {/* Sound Cues Toggle */}
            <button
              onClick={onToggleSound}
              className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl border text-xs flex items-center justify-center transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
              title={`Sound Cues: ${soundEnabled ? 'Enabled' : 'Muted'} (Alt+S)`}
              aria-label={`Sound Cues: ${soundEnabled ? 'Enabled' : 'Muted'}. Press to toggle sound feedback. Keyboard shortcut: Alt plus S.`}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              )}
            </button>

            {/* Mobile More Options Button */}
            <div className="relative">
              <button
                onClick={() => setIsMoreOpen((prev) => !prev)}
                className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border text-xs transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                  isMoreOpen
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                }`}
                title="More room controls & accessibility"
                aria-label="Open more room options and accessibility settings menu"
                aria-haspopup="menu"
                aria-expanded={isMoreOpen}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {/* Mobile Dropdown Menu */}
              {isMoreOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs sm:hidden"
                    onClick={() => setIsMoreOpen(false)}
                    aria-hidden="true"
                  />
                  <div
                    ref={moreMenuRef}
                    role="menu"
                    aria-label="More room options"
                    className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-zinc-900 border border-zinc-700/90 shadow-2xl p-2 z-50 sm:hidden animate-fade-in text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-800 pb-1.5 mb-1">
                      <span>Room Options</span>
                      <button
                        onClick={() => setIsMoreOpen(false)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200"
                        aria-label="Close options menu"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      role="menuitem"
                      onClick={() => {
                        setIsMoreOpen(false);
                        onOpenA11yModal();
                      }}
                      className="min-h-[44px] w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-zinc-200 hover:text-white hover:bg-zinc-800 transition cursor-pointer text-left"
                      aria-label="Open accessibility and keyboard shortcuts guide"
                    >
                      <Eye className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-zinc-100 text-xs">Accessibility & Guide</div>
                        <div className="text-[10px] text-zinc-400">High contrast, haptics & voice</div>
                      </div>
                    </button>

                    {onToggleLock && (
                      <button
                        role="menuitem"
                        onClick={() => {
                          setIsMoreOpen(false);
                          onToggleLock();
                        }}
                        className="min-h-[44px] w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-zinc-200 hover:text-white hover:bg-zinc-800 transition cursor-pointer text-left"
                        aria-label="Toggle Privacy Shield screen lock. Keyboard shortcut: Alt plus L."
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-zinc-100 text-xs">Privacy Shield Lock</div>
                          <div className="text-[10px] text-zinc-400">Instantly obscure screen (Alt+L)</div>
                        </div>
                      </button>
                    )}

                    {/* Battery Guard & Simulator Option */}
                    <div className="pt-1.5 pb-1 border-t border-zinc-800/80 text-[11px] px-2.5 space-y-1">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-medium text-zinc-300">Battery Status</span>
                        {battery.isSupported ? (
                          <span className={battery.isLow ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                            {battery.level}% {battery.charging ? '(Charging)' : battery.isLow ? '(Low!)' : ''}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[10px]">Hardware API not available</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (battery.isLow) {
                            simulateBatteryLevel(null);
                          } else {
                            simulateBatteryLevel(14);
                          }
                          setIsMoreOpen(false);
                        }}
                        className="w-full py-2 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer text-center"
                      >
                        {battery.isLow ? 'Reset Battery Status' : 'Test Low Battery Warning (<20%)'}
                      </button>
                    </div>

                    <div className="pt-1 border-t border-zinc-800">
                      <PWAInstallButton variant="menuitem" onItemClick={() => setIsMoreOpen(false)} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Row 2 on Mobile: Privacy Indicators on Left, End Chat Button on Right */}
        <div className="flex sm:hidden items-center justify-between gap-2.5 w-full pt-2 pb-0.5 border-t border-zinc-800/80 min-w-0">
          {/* Privacy, Battery Warning & Connection Indicators */}
          <div
            className="flex items-center gap-2 min-w-0 flex-1 overflow-x-auto no-scrollbar py-0.5"
            role="group"
            aria-label="Room privacy, battery, and connection indicators"
          >
            {/* Critical Low Battery Alert Pill in Row 2 */}
            {battery.isSupported && battery.isLow && (
              <span
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-bold flex-shrink-0 animate-pulse select-none shadow-xs"
                role="alert"
                aria-label={`Low battery warning: Device battery is at ${battery.level}%. Connect charger to prevent unexpected mid-chat disconnection.`}
                title={`Battery Low (${battery.level}%): Connect charger to avoid session disconnection`}
              >
                <BatteryWarning className="w-4 h-4 text-amber-400" aria-hidden="true" />
                <span>Low Battery ({battery.level}%)</span>
              </span>
            )}

            {/* E2EE Security Badge */}
            <span
              className="min-h-[44px] inline-flex items-center gap-1.5 px-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold flex-shrink-0 select-none"
              role="status"
              aria-label="Privacy status: End-to-end encryption verified. Messages are ephemeral and securely encrypted."
              title="End-to-End Encrypted: Only you and your peer can read messages"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              <span>E2EE</span>
            </span>

            {/* Live Connection Badge */}
            <span
              className="min-h-[44px] inline-flex items-center gap-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium flex-shrink-0 select-none text-zinc-200"
              role="status"
              aria-label={`Connection status: ${
                connectionState === 'connected'
                  ? 'Connected securely to chat server'
                  : connectionState === 'reconnecting'
                  ? 'Reconnecting to chat server'
                  : 'Disconnected from chat server'
              }`}
              title={`Server connection: ${connectionState}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionState === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : connectionState === 'reconnecting'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-zinc-500'
                }`}
                aria-hidden="true"
              />
              <span className={connectionState === 'connected' ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {connectionState === 'connected' ? 'Connected' : connectionState === 'reconnecting' ? 'Reconnecting' : 'Offline'}
              </span>
            </span>

            {/* Peer Presence Badge */}
            {roomData?.status === 'ACTIVE' && (
              <span
                className="min-h-[44px] inline-flex items-center gap-2 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium min-w-0 truncate select-none text-zinc-200"
                role="status"
                aria-label={`Participant status: ${otherName || 'Peer'} is ${
                  isOtherConnected ? 'currently active in this room' : 'currently away'
                }`}
                title={`${otherName || 'Peer'} is ${isOtherConnected ? 'active in room' : 'away'}`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    isOtherConnected ? 'bg-emerald-500' : 'bg-zinc-600'
                  }`}
                  aria-hidden="true"
                />
                <span className={`truncate ${isOtherConnected ? 'text-zinc-100 font-medium' : 'text-zinc-400'}`}>
                  {otherName || 'Peer'} {isOtherConnected ? 'Active' : 'Away'}
                </span>
              </span>
            )}
          </div>

          {/* End Chat Button on Mobile Row 2 (44px+ touch target size and explicit aria-label) */}
          {roomData && (
            <button
              onClick={onOpenEndModal}
              className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none flex-shrink-0 shadow-sm"
              title="End conversation and destroy room (Shortcut: Alt+E)"
              aria-label="End conversation and destroy ephemeral room. Opens confirmation dialog. Keyboard shortcut: Alt plus E."
            >
              <LogOut className="w-4 h-4 flex-shrink-0 text-rose-400" aria-hidden="true" />
              <span>End Chat</span>
            </button>
          )}
        </div>

        {/* Desktop Toolbar (Hidden on Mobile) */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0 relative" role="toolbar" aria-label="Room Controls">
          {/* Desktop Battery Status Indicator */}
          {battery.isSupported && (
            <div
              role="status"
              aria-label={
                battery.isLow
                  ? `Low battery alert: ${battery.level}% remaining. Connect charger to prevent disconnection.`
                  : `Device battery: ${battery.level}%${battery.charging ? ', charging' : ''}`
              }
              title={
                battery.isLow
                  ? `Warning: Battery at ${battery.level}%. Connect charger to prevent mid-chat disconnection!`
                  : `Battery: ${battery.level}%${battery.charging ? ' (Charging)' : ''}`
              }
              className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition select-none ${
                battery.isLow
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold animate-pulse'
                  : battery.charging
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {battery.isLow ? (
                <>
                  <BatteryWarning className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span className="font-bold text-amber-200">{battery.level}% (Low)</span>
                </>
              ) : battery.charging ? (
                <>
                  <BatteryCharging className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span className="font-mono">{battery.level}%</span>
                </>
              ) : (
                <>
                  {battery.level <= 30 ? (
                    <BatteryLow className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  ) : (
                    <Battery className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                  )}
                  <span className="font-mono">{battery.level}%</span>
                </>
              )}
            </div>
          )}

          {/* Sound Cues Toggle */}
          <button
            onClick={onToggleSound}
            className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs flex items-center justify-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title={`Sound Cues: ${soundEnabled ? 'Enabled' : 'Muted'} (Alt+S)`}
            aria-label={`Sound Cues: ${soundEnabled ? 'Enabled' : 'Muted'}. Press to toggle sound feedback. Keyboard shortcut: Alt plus S.`}
            aria-pressed={soundEnabled}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-500 flex-shrink-0" aria-hidden="true" />
            )}
            <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </button>

          {/* Accessibility Guide Button */}
          <button
            onClick={onOpenA11yModal}
            className="min-h-[44px] px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            title="Blind & Screen Reader Accessibility Guide (Alt+A)"
            aria-label="Open Accessibility & Keyboard Shortcuts Guide. Keyboard shortcut: Alt plus A."
          >
            <Eye className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
            <span>Accessibility</span>
          </button>

          <PWAInstallButton />

          {/* Privacy Screen Lock Button */}
          {onToggleLock && (
            <button
              onClick={onToggleLock}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
              title="Quick Privacy Shield Lock (Alt+L)"
              aria-label="Lock screen with Privacy Shield. Keyboard shortcut: Alt plus L."
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
              <span>Shield</span>
            </button>
          )}

          {/* Desktop End Chat Button */}
          {roomData && (
            <button
              onClick={onOpenEndModal}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 active:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none flex-shrink-0 shadow-sm"
              title="End conversation and destroy room (Shortcut: Alt+E)"
              aria-label="End conversation and destroy ephemeral room. Opens confirmation dialog. Keyboard shortcut: Alt plus E."
            >
              <LogOut className="w-4 h-4 flex-shrink-0 text-rose-400" aria-hidden="true" />
              <span>End Chat</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

