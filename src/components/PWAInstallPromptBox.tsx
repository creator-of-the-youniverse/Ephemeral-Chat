import React, { useState, useEffect } from 'react';
import { Download, Share, X, Sparkles, Check, Smartphone, Volume2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { safeGetSessionStorage, safeSetSessionStorage } from '../lib/safeStorage';
import { speakVoicePrompt } from '../lib/speech';
import { playInstallPromptChime } from '../lib/sound';
import { announce } from '../lib/announcer';

const DISMISSED_KEY = 'privachat_install_prompt_dismissed';

interface PWAInstallPromptBoxProps {
  /**
   * If 'banner', displays as a floating bottom prompt box.
   * If 'card', displays inline as a feature box (e.g. on the landing page).
   */
  variant?: 'banner' | 'card';
  onDismiss?: () => void;
}

export const PWAInstallPromptBox: React.FC<PWAInstallPromptBoxProps> = ({
  variant = 'banner',
  onDismiss,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return safeGetSessionStorage(DISMISSED_KEY) === 'true';
  });
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed as a standalone app, do not show prompt
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    safeSetSessionStorage(DISMISSED_KEY, 'true');
    announce('Install prompt dismissed. You can install anytime from the header.', 'polite');
    onDismiss?.();
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      playInstallPromptChime();
      const msg = 'Install PrivaChat on iOS Safari. Tap Share in the bottom toolbar, then choose Add to Home Screen.';
      announce(msg, 'assertive');
      speakVoicePrompt(msg);
      return;
    }

    const success = await install();
    if (success) {
      setIsDismissed(true);
    }
  };

  const handleReplayVoicePrompt = () => {
    playInstallPromptChime();
    const instructions =
      'To install PrivaChat on your iPhone or iPad: Tap the Share button in Safari bottom toolbar. Then scroll down and select Add to Home Screen, and tap Add in the top right.';
    announce(instructions, 'polite');
    speakVoicePrompt(instructions, { force: true });
  };

  // Card variant (embedded inside landing page)
  if (variant === 'card') {
    return (
      <aside
        role="region"
        aria-label="Install PrivaChat App"
        className="w-full rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950 border border-emerald-500/30 p-4 sm:p-5 shadow-xl text-left space-y-3 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-inner">
              <Smartphone className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-zinc-100">
                  Install PrivaChat
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                  App
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Add to your device home screen for fast, full-screen private chat.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            aria-label="Dismiss install box"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <ul className="text-xs text-zinc-300 space-y-1.5 pt-1">
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Standalone full-screen mode without browser address bars</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span>Instant door knock earcons & low-battery guard</span>
          </li>
        </ul>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleInstall}
            className="min-h-[44px] flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>{isIOS ? 'Install on iPhone / iPad' : 'Install App to Home Screen'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="min-h-[44px] py-2.5 px-3.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition cursor-pointer"
          >
            Maybe Later
          </button>
        </div>

        {/* iOS Step-by-Step Modal */}
        {showIOSModal && (
          <div
            role="presentation"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="ios-card-guide-title"
              className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700/80 p-6 shadow-2xl text-left space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Share className="w-5 h-5 text-emerald-400" />
                  <h3 id="ios-card-guide-title" className="font-semibold text-sm text-zinc-100">
                    Install on iOS Safari
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
                  aria-label="Close iOS guide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2">
                  <span className="font-bold text-emerald-400">1.</span>
                  <p>
                    Tap the <strong>Share</strong> button <Share className="w-3 h-3 text-emerald-400 inline" /> in Safari's bottom bar.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2">
                  <span className="font-bold text-emerald-400">2.</span>
                  <p>
                    Scroll down and select <strong>"Add to Home Screen"</strong>.
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2">
                  <span className="font-bold text-emerald-400">3.</span>
                  <p>
                    Tap <strong>"Add"</strong> in the top right corner.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReplayVoicePrompt}
                  className="min-h-[44px] flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Voice Guide</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  className="min-h-[44px] py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition cursor-pointer"
                >
                  Got It
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    );
  }

  // Floating Banner / Prompt Box variant
  return (
    <>
      <div
        role="region"
        aria-label="Install App Prompt"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 rounded-2xl bg-zinc-900/98 border border-emerald-500/40 p-4 shadow-2xl backdrop-blur-md animate-fade-in text-left space-y-3"
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-inner">
              <Download className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-semibold text-xs sm:text-sm text-zinc-100">
                  Install PrivaChat
                </h4>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase tracking-wider">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                Install as a standalone app for fast launch & background security alerts.
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 transition cursor-pointer -mt-1 -mr-1"
            aria-label="Close install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={handleInstall}
            className="min-h-[44px] flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>{isIOS ? 'Install on iOS' : 'Install App'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="min-h-[44px] py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* iOS Step-by-Step Modal */}
      {showIOSModal && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-banner-guide-title"
            className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-700/80 p-6 shadow-2xl text-left space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Share className="w-5 h-5 text-emerald-400" />
                <h3 id="ios-banner-guide-title" className="font-semibold text-sm text-zinc-100">
                  Install on iOS Safari
                </h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200"
                aria-label="Close iOS guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-zinc-300">
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2">
                <span className="font-bold text-emerald-400">1.</span>
                <p>
                  Tap the <strong>Share</strong> button <Share className="w-3 h-3 text-emerald-400 inline" /> in Safari's bottom bar.
                </p>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2">
                <span className="font-bold text-emerald-400">2.</span>
                <p>
                  Scroll down and select <strong>"Add to Home Screen"</strong>.
                </p>
              </div>
              <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 flex items-start gap-2">
                <span className="font-bold text-emerald-400">3.</span>
                <p>
                  Tap <strong>"Add"</strong> in the top right corner.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleReplayVoicePrompt}
                className="min-h-[44px] flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Voice Guide</span>
              </button>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="min-h-[44px] py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
