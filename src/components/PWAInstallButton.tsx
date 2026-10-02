import React, { useState, useEffect, useRef } from 'react';
import { Download, Share, X, Volume2 } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';
import { speakVoicePrompt } from '../lib/speech';
import { playInstallPromptChime } from '../lib/sound';
import { announce } from '../lib/announcer';

export { usePWAInstall, useOnlineStatus };

interface PWAInstallButtonProps {
  variant?: 'button' | 'menuitem';
  onItemClick?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'button',
  onItemClick,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const iosModalRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // If already running as an installed PWA, hide
  if (isInstalled) {
    return null;
  }

  const handleOpenIOSGuide = () => {
    setShowIOSGuide(true);
    playInstallPromptChime();
    const instructions =
      'Install PrivaChat on iOS Safari. Step 1: Tap the Share button in Safari bottom toolbar. Step 2: Scroll down and select Add to Home Screen.';
    announce(instructions, 'assertive');
    speakVoicePrompt(instructions);
    onItemClick?.();
  };

  const handleInstallClick = () => {
    install();
    onItemClick?.();
  };

  const handleReplayVoicePrompt = () => {
    playInstallPromptChime();
    const instructions =
      'Instructions to install PrivaChat on your iPhone or iPad: First, tap the Share button in the Safari toolbar at the bottom of your screen. Second, scroll down the share menu and select Add to Home Screen. Finally, tap Add in the top right. PrivaChat will now be on your home screen.';
    announce(instructions, 'polite');
    speakVoicePrompt(instructions, { force: true });
  };

  // Keyboard trap and Escape for iOS guide modal
  useEffect(() => {
    if (!showIOSGuide) return;

    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowIOSGuide(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIOSGuide]);

  if (variant === 'menuitem') {
    return (
      <>
        <button
          role="menuitem"
          onClick={isIOS ? handleOpenIOSGuide : handleInstallClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-zinc-200 hover:text-white hover:bg-zinc-800 transition cursor-pointer text-left"
        >
          <Download className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-zinc-100">{isIOS ? 'Install on iOS Safari' : 'Install PrivaChat App'}</div>
            <div className="text-[10px] text-zinc-400">Offline PWA shortcut (Alt+I)</div>
          </div>
        </button>

        {showIOSGuide && (
          <div
            role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in"
          >
            <div
              ref={iosModalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="ios-pwa-title"
              aria-describedby="ios-pwa-desc"
              className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700/80 p-6 shadow-2xl text-left space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <h3 id="ios-pwa-title" className="font-semibold text-sm text-zinc-100">
                    Install on iOS / Safari
                  </h3>
                </div>
                <button
                  ref={closeBtnRef}
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  aria-label="Close iOS install guide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div id="ios-pwa-desc" className="space-y-3 text-xs text-zinc-300">
                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="font-bold text-emerald-400">1.</span>
                  <div>
                    <span>Tap the </span>
                    <strong className="text-zinc-100 inline-flex items-center gap-1 font-semibold">
                      <Share className="w-3 h-3 text-emerald-400 inline" /> Share
                    </strong>
                    <span> button in the Safari bottom toolbar.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="font-bold text-emerald-400">2.</span>
                  <div>
                    <span>Scroll down and tap </span>
                    <strong className="text-zinc-100 font-semibold">"Add to Home Screen"</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <span className="font-bold text-emerald-400">3.</span>
                  <div>
                    <span>Tap </span>
                    <strong className="text-zinc-100 font-semibold">"Add"</strong>
                    <span> in the upper right. Launch directly for a full-screen, offline-capable experience.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={handleReplayVoicePrompt}
                  className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                  aria-label="Replay audio install instructions"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Replay Voice Guide</span>
                </button>

                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {isInstallable ? (
        <button
          onClick={handleInstallClick}
          className="h-9 sm:h-auto px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none flex items-center gap-1.5"
          title="Install PrivaChat as App (Shortcut: Alt+I)"
          aria-label="Install PrivaChat as App. Keyboard shortcut: Alt plus I."
        >
          <Download className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      ) : isIOS ? (
        <button
          onClick={handleOpenIOSGuide}
          className="h-9 sm:h-auto px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none flex items-center gap-1.5"
          title="Install on iPhone / iPad (Shortcut: Alt+I)"
          aria-label="Install PrivaChat on iPhone or iPad. Keyboard shortcut: Alt plus I."
        >
          <Download className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Install PWA</span>
        </button>
      ) : (
        <button
          onClick={handleInstallClick}
          className="h-9 sm:h-auto px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs font-medium transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none flex items-center gap-1.5"
          title="Install PrivaChat as PWA (Shortcut: Alt+I)"
          aria-label="Install PrivaChat App. Keyboard shortcut: Alt plus I."
        >
          <Download className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Install App</span>
        </button>
      )}

      {showIOSGuide && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in"
        >
          <div
            ref={iosModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-title"
            aria-describedby="ios-pwa-desc"
            className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700/80 p-6 shadow-2xl text-left space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 id="ios-pwa-title" className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                <Share className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Install on iOS Safari</span>
              </h3>
              <button
                ref={closeBtnRef}
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
                aria-label="Close installation guide"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div id="ios-pwa-desc" className="space-y-3 text-sm text-zinc-300">
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-xs text-zinc-300 font-mono">1</span>
                <p>Tap the <span className="font-semibold text-emerald-400">Share</span> icon in Safari toolbar at the bottom.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-xs text-zinc-300 font-mono">2</span>
                <p>Scroll down and tap <span className="font-semibold text-emerald-400">Add to Home Screen</span>.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-zinc-800 text-xs text-zinc-300 font-mono">3</span>
                <p>Open from your Home Screen for a fast, full-screen private chat experience.</p>
              </div>
            </div>

            {/* Voice Prompt Playback Button */}
            <button
              type="button"
              onClick={handleReplayVoicePrompt}
              className="w-full py-2 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label="Listen to spoken audio installation instructions"
            >
              <Volume2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Read Instructions Aloud</span>
            </button>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-sm text-zinc-950 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-950/95 border border-amber-500/40 text-amber-200 px-4 py-2.5 text-xs font-medium shadow-xl backdrop-blur-md"
    >
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" aria-hidden="true" />
      <span>Network offline — waiting for network reconnection...</span>
    </div>
  );
};
