/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useEphemeralRoom } from './hooks/useEphemeralRoom';
import { Header } from './components/Header';
import { LandingView } from './components/LandingView';
import { LobbyView } from './components/LobbyView';
import { WaitingRoomView } from './components/WaitingRoomView';
import { ChatView } from './components/ChatView';
import { EndChatModal } from './components/EndChatModal';
import { DestroyedNotice } from './components/DestroyedNotice';
import { BiometricLockModal } from './components/BiometricLockModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { OfflineIndicator, PWAInstallButton, usePWAInstall } from './components/PWAInstallButton';
import { PWAInstallPromptBox } from './components/PWAInstallPromptBox';
import { registerAppServiceWorker } from './lib/registerServiceWorker';
import { isSoundEnabled, setSoundEnabled } from './lib/sound';
import { isVoicePromptsEnabled, setVoicePromptsEnabled, speakVoicePrompt } from './lib/speech';
import { isHighContrastEnabled, setHighContrastEnabled } from './lib/highContrast';
import { isHapticEnabled, setHapticEnabled, triggerHaptic } from './lib/haptic';
import {
  isShakeEnabled,
  setShakeEnabled,
  getShakeAction,
  setShakeAction,
  testShakeHaptic,
  ShakeAction,
} from './lib/shake';
import { useDeviceShake } from './hooks/useDeviceShake';
import { announce } from './lib/announcer';
import { DoorClosed, Eye, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const {
    roomId,
    role,
    roomData,
    status,
    guestKnocked,
    connectionState,
    error,
    knockDeclined,
    peerTyping,
    bothEndedNotice,
    otherParticipantEndedNotice,
    createRoom,
    knock,
    openDoor,
    keepDoorClosed,
    sendMessage,
    sendImageMessage,
    destroyMessage,
    clearHistory,
    endMySide,
    updateSettings,
    sendTyping,
    resetToLanding,
  } = useEphemeralRoom();

  const { install: installPWA } = usePWAInstall();

  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [isShieldLocked, setIsShieldLocked] = useState(false);
  const [isA11yModalOpen, setIsA11yModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => isSoundEnabled());
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(() => isVoicePromptsEnabled());
  const [highContrastEnabled, setHighContrastEnabledState] = useState<boolean>(() => isHighContrastEnabled());
  const [hapticEnabled, setHapticEnabledState] = useState<boolean>(() => isHapticEnabled());
  const [shakeEnabled, setShakeEnabledState] = useState<boolean>(() => isShakeEnabled());
  const [shakeAction, setShakeActionState] = useState<ShakeAction>(() => getShakeAction());
  const [draftMessage, setDraftMessage] = useState<string>('');

  const isRoomActiveOrEnded = (status === 'ACTIVE' || status === 'ENDED') && !!roomData;
  const { shakeToast } = useDeviceShake({
    onEndChat: endMySide,
    onClearHistory: clearHistory,
    onOpenEndModal: () => setIsEndModalOpen(true),
    active: isRoomActiveOrEnded,
  });

  const handleCreateRoom = useCallback(async (hostName: string, initialDraftMessage?: string) => {
    if (initialDraftMessage) {
      setDraftMessage(initialDraftMessage);
    }
    return await createRoom(hostName);
  }, [createRoom]);

  const handleResetToLanding = useCallback(() => {
    setDraftMessage('');
    resetToLanding();
  }, [resetToLanding]);

  const handleToggleSound = useCallback(() => {
    setSoundEnabledState((prev) => {
      const next = !prev;
      setSoundEnabled(next);
      announce(
        next ? 'Auditory sound cues enabled.' : 'Auditory sound cues muted.',
        'polite'
      );
      return next;
    });
  }, []);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabledState((prev) => {
      const next = !prev;
      setVoicePromptsEnabled(next);
      const msg = next ? 'Accessibility voice prompts enabled.' : 'Accessibility voice prompts muted.';
      announce(msg, 'polite');
      if (next) {
        speakVoicePrompt(msg, { force: true });
      }
      return next;
    });
  }, []);

  const handleToggleHighContrast = useCallback(() => {
    setHighContrastEnabledState((prev) => {
      const next = !prev;
      setHighContrastEnabled(next);
      const msg = next
        ? 'High Contrast mode enabled: pure white text on deep black background with thick borders.'
        : 'High Contrast mode disabled: default palette restored.';
      announce(msg, 'polite');
      speakVoicePrompt(msg);
      return next;
    });
  }, []);

  const handleToggleHaptic = useCallback(() => {
    setHapticEnabledState((prev) => {
      const next = !prev;
      setHapticEnabled(next);
      if (next) {
        triggerHaptic([30, 40, 30]);
      }
      const msg = next
        ? 'Tactile haptic feedback enabled.'
        : 'Tactile haptic feedback disabled.';
      announce(msg, 'polite');
      speakVoicePrompt(msg);
      return next;
    });
  }, []);

  const handleToggleShake = useCallback(() => {
    setShakeEnabledState((prev) => {
      const next = !prev;
      setShakeEnabled(next);
      if (next) {
        testShakeHaptic();
      }
      const msg = next
        ? 'Device shake panic wipe enabled.'
        : 'Device shake panic wipe disabled.';
      announce(msg, 'polite');
      speakVoicePrompt(msg);
      return next;
    });
  }, []);

  const handleChangeShakeAction = useCallback((action: ShakeAction) => {
    setShakeActionState(action);
    setShakeAction(action);
    testShakeHaptic();
    const actionLabel =
      action === 'end_chat'
        ? 'Immediate End Chat'
        : action === 'clear_history'
        ? 'Clear All Messages'
        : 'Open End Chat Confirmation';
    const msg = `Shake gesture action set to: ${actionLabel}.`;
    announce(msg, 'polite');
    speakVoicePrompt(msg);
  }, []);

  // Register PWA Service Worker strictly after the initial React render is complete
  useEffect(() => {
    registerAppServiceWorker();
  }, []);

  // Global Keyboard Shortcuts for complete blind accessibility:
  // Alt+A: Open Accessibility & Shortcuts Guide
  // Alt+C: Toggle High Contrast Mode
  // Alt+H: Toggle Tactile Haptic Vibrations
  // Alt+I: Install / Download PWA with Voice Guidance
  // Alt+S: Toggle Sound Cues
  // Alt+L: Toggle Privacy Shield Lock
  // Alt+E: Open End Chat Dialog (if in room)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          setIsA11yModalOpen((prev) => !prev);
          return;
        }
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          handleToggleHighContrast();
          return;
        }
        if (e.key === 'h' || e.key === 'H') {
          e.preventDefault();
          handleToggleHaptic();
          return;
        }
        if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          installPWA();
          return;
        }
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          handleToggleSound();
          return;
        }
        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          setIsShieldLocked((prev) => !prev);
          return;
        }
        if (e.key === 'e' || e.key === 'E') {
          if (status === 'ACTIVE' || status === 'ENDED' || roomData) {
            e.preventDefault();
            setIsEndModalOpen(true);
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleHaptic, handleToggleHighContrast, handleToggleSound, installPWA, status, roomData]);

  const isHost = role === 'host';
  const otherName = isHost ? roomData?.guestName || 'Guest' : roomData?.hostName || 'Host';

  // Render Destroyed / Closed screen
  if (bothEndedNotice || status === 'DESTROYED') {
    return (
      <main className="min-h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center">
        {/* Skip to Content */}
        <a
          href="#destroyed-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-zinc-950 focus:font-bold focus:rounded-xl focus:shadow-xl focus:outline-none"
        >
          Skip to destroyed message
        </a>
        <div id="destroyed-content" className="w-full flex flex-col items-center justify-center">
          <DestroyedNotice
            onStartNew={handleResetToLanding}
            message={error || 'The private room has been permanently destroyed.'}
            isExpiredOrNonExistent={!!error}
          />
        </div>
        <OfflineIndicator />
        <AccessibilityModal
          isOpen={isA11yModalOpen}
          onClose={() => setIsA11yModalOpen(false)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          voiceEnabled={voiceEnabled}
          onToggleVoice={handleToggleVoice}
          highContrastEnabled={highContrastEnabled}
          onToggleHighContrast={handleToggleHighContrast}
          hapticEnabled={hapticEnabled}
          onToggleHaptic={handleToggleHaptic}
          shakeEnabled={shakeEnabled}
          onToggleShake={handleToggleShake}
          shakeAction={shakeAction}
          onChangeShakeAction={handleChangeShakeAction}
          onTestShakeHaptic={testShakeHaptic}
        />
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Accessible Skip Link for Keyboard / Screen Reader users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-zinc-950 focus:font-bold focus:rounded-xl focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Top Header when inside a room flow */}
      {status !== 'IDLE' ? (
        <Header
          roomData={roomData}
          connectionState={connectionState}
          role={role}
          onOpenEndModal={() => setIsEndModalOpen(true)}
          onToggleLock={() => setIsShieldLocked(true)}
          onUpdateTimer={(sec) => updateSettings(sec)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onOpenA11yModal={() => setIsA11yModalOpen(true)}
        />
      ) : (
        /* Top Navigation Header for Landing Screen */
        <header role="banner" className="w-full border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md safe-top px-3 py-2 sm:px-6 sm:py-2.5">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-inner flex-shrink-0"
                aria-hidden="true"
              >
                <DoorClosed className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-semibold text-sm text-zinc-100 tracking-tight">
                  PrivaChat
                </span>
                <span className="hidden sm:inline text-xs text-zinc-500">
                  Ephemeral 2-Person Chat
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0" role="toolbar" aria-label="Accessibility & App Controls">
              {/* Sound Cues Toggle */}
              <button
                onClick={handleToggleSound}
                className={`h-9 w-9 sm:h-auto sm:w-auto p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center justify-center gap-1.5 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${
                  soundEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
                title={`Sound Cues: ${soundEnabled ? 'Enabled' : 'Muted'} (Alt+S)`}
                aria-label={`Sound Cues: ${soundEnabled ? 'Enabled' : 'Muted'}. Press to toggle. Keyboard shortcut: Alt plus S.`}
                aria-pressed={soundEnabled}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-4 h-4 text-zinc-500 flex-shrink-0" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
              </button>

              {/* Accessibility Modal Button */}
              <button
                onClick={() => setIsA11yModalOpen(true)}
                className="h-9 w-9 sm:h-auto sm:w-auto p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs flex items-center justify-center gap-1.5 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                title="Blind & Screen Reader Accessibility Guide (Alt+A)"
                aria-label="Open Accessibility & Keyboard Shortcuts Guide. Keyboard shortcut: Alt plus A."
              >
                <Eye className="w-4 h-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Accessibility</span>
              </button>

              <PWAInstallButton />
            </div>
          </div>
        </header>
      )}

      {/* Main Flow Views based on Room State Machine */}
      <main id="main-content" className="flex-1 flex flex-col w-full">
        {status === 'IDLE' && !roomId && (
          <LandingView onCreateRoom={handleCreateRoom} error={error} />
        )}

        {status === 'IDLE' && roomId && (
          <div
            role="status"
            aria-live="polite"
            className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in my-auto"
          >
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-xl">
              <span className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-1">
              <h1 className="text-base font-medium text-zinc-200">Connecting to private room...</h1>
              <p className="text-xs text-zinc-500">Establishing end-to-end encrypted channel</p>
            </div>
            {error && (
              <div role="alert" className="max-w-sm p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2 text-center">
                <p>{error}</p>
                <button
                  onClick={handleResetToLanding}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer transition focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  Return to Home
                </button>
              </div>
            )}
          </div>
        )}

        {/* Host Lobby View (Waiting for guest or answering a knock) */}
        {isHost && (status === 'WAITING_FOR_GUEST' || status === 'GUEST_KNOCKED') && roomId && (
          <LobbyView
            roomId={roomId}
            roomData={roomData}
            guestKnocked={guestKnocked}
            draftMessage={draftMessage}
            onUpdateDraftMessage={setDraftMessage}
            onOpenDoor={openDoor}
            onKeepDoorClosed={keepDoorClosed}
          />
        )}

        {/* Guest Waiting Room View (Enter name & knock, or wait for host approval) */}
        {!isHost && (status === 'WAITING_FOR_GUEST' || status === 'GUEST_KNOCKED') && (
          <WaitingRoomView
            roomData={roomData}
            onKnock={knock}
            hasKnocked={status === 'GUEST_KNOCKED'}
            knockDeclined={knockDeclined}
            error={error}
          />
        )}

        {/* Active or Ended Two-Person Chat */}
        {(status === 'ACTIVE' || status === 'ENDED') && roomData && role && (
          <ChatView
            roomData={roomData}
            role={role}
            onSendMessage={sendMessage}
            onSendImage={sendImageMessage}
            onDestroyMessage={destroyMessage}
            onSendTyping={sendTyping}
            peerTyping={peerTyping}
            otherParticipantEndedNotice={otherParticipantEndedNotice}
            onUpdateTimer={updateSettings}
            initialDraftMessage={draftMessage}
            onClearDraftMessage={() => setDraftMessage('')}
          />
        )}
        {/* Fallback view if room is initializing or in transition */}
        {!(status === 'IDLE' && !roomId) &&
         !(status === 'IDLE' && roomId) &&
         !(isHost && (status === 'WAITING_FOR_GUEST' || status === 'GUEST_KNOCKED') && roomId) &&
         !(!isHost && (status === 'WAITING_FOR_GUEST' || status === 'GUEST_KNOCKED')) &&
         !((status === 'ACTIVE' || status === 'ENDED') && roomData && role) && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-xl">
              <span className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-zinc-300">Loading private chat room...</p>
            <button
              onClick={handleResetToLanding}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition cursor-pointer"
            >
              Return to PrivaChat
            </button>
          </div>
        )}
      </main>

      {/* End Chat Confirmation Modal */}
      <EndChatModal
        isOpen={isEndModalOpen}
        onClose={() => setIsEndModalOpen(false)}
        onConfirmEnd={endMySide}
        isHost={isHost}
        otherName={otherName}
      />

      {/* Privacy Screen Shield */}
      <BiometricLockModal
        isLocked={isShieldLocked}
        onUnlock={() => setIsShieldLocked(false)}
      />

      {/* Accessibility & Keyboard Guide Modal */}
      <AccessibilityModal
        isOpen={isA11yModalOpen}
        onClose={() => setIsA11yModalOpen(false)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleToggleVoice}
        highContrastEnabled={highContrastEnabled}
        onToggleHighContrast={handleToggleHighContrast}
        hapticEnabled={hapticEnabled}
        onToggleHaptic={handleToggleHaptic}
        shakeEnabled={shakeEnabled}
        onToggleShake={handleToggleShake}
        shakeAction={shakeAction}
        onChangeShakeAction={handleChangeShakeAction}
        onTestShakeHaptic={testShakeHaptic}
      />

      {/* In-App Floating Install Prompt Box (Prompts uninstalled users) */}
      <PWAInstallPromptBox variant="banner" />

      {/* Shake Gesture Emergency Toast */}
      {shakeToast && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border-2 border-emerald-500/80 text-zinc-100 shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md animate-bounce-short pointer-events-none"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping flex-shrink-0" aria-hidden="true" />
          <span>{shakeToast}</span>
        </div>
      )}

      {/* Network Offline Toast */}
      <OfflineIndicator />
    </div>
  );
}
