import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, Keyboard, Eye, Shield, Check, X, Mic, Download, Contrast, Smartphone, Activity } from 'lucide-react';
import { ShakeAction } from '../lib/shake';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  highContrastEnabled: boolean;
  onToggleHighContrast: () => void;
  hapticEnabled: boolean;
  onToggleHaptic: () => void;
  shakeEnabled: boolean;
  onToggleShake: () => void;
  shakeAction: ShakeAction;
  onChangeShakeAction: (action: ShakeAction) => void;
  onTestShakeHaptic: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
  voiceEnabled = true,
  onToggleVoice,
  highContrastEnabled,
  onToggleHighContrast,
  hapticEnabled,
  onToggleHaptic,
  shakeEnabled,
  onToggleShake,
  shakeAction,
  onChangeShakeAction,
  onTestShakeHaptic,
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    if (!isOpen) return;

    // Focus close button initially
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="a11y-modal-title"
        aria-describedby="a11y-modal-desc"
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 text-zinc-100 flex flex-col max-h-[90dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 id="a11y-modal-title" className="text-base sm:text-lg font-semibold text-zinc-100">
                Blind & Screen Reader Accessibility
              </h2>
              <p id="a11y-modal-desc" className="text-xs text-zinc-400">
                Full accessibility settings, contrast, tactile haptics, and sound cues
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="Close accessibility settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* High Contrast Mode Toggle */}
        <div className="py-3.5 border-b border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                <Contrast className="w-4 h-4 text-emerald-400" />
                <span>High Contrast Mode</span>
              </span>
              <p className="text-xs text-zinc-400">
                Adjusts colors to pure white text on deep black backgrounds with thicker 2px solid borders for visual impairments.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={highContrastEnabled}
              onClick={onToggleHighContrast}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                highContrastEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  highContrastEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tactile Haptic Feedback Toggle */}
        <div className="py-3.5 border-b border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Tactile Haptic Feedback (Vibrations)</span>
              </span>
              <p className="text-xs text-zinc-400">
                Triggers short vibration patterns when buttons are pressed, messages arrive, doors open, or photos are captured.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={hapticEnabled}
              onClick={onToggleHaptic}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                hapticEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  hapticEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Device Shake Panic Gesture Toggle & Action */}
        <div className="py-3.5 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Device Shake Gesture (Panic Wipe)</span>
              </span>
              <p className="text-xs text-zinc-400">
                Physically shake your phone to trigger an immediate panic wipe or end conversation, confirmed via Haptic API tactile vibrations.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={shakeEnabled}
              onClick={onToggleShake}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                shakeEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  shakeEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {shakeEnabled && (
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-medium text-zinc-300">
                Action on Shake:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => onChangeShakeAction('end_chat')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                    shakeAction === 'end_chat'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-semibold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-zinc-100 font-semibold">Immediate End Chat</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Close & wipe conversation</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeShakeAction('clear_history')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                    shakeAction === 'clear_history'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-semibold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-zinc-100 font-semibold">Clear History</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Wipe messages now</span>
                </button>

                <button
                  type="button"
                  onClick={() => onChangeShakeAction('prompt_end')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                    shakeAction === 'prompt_end'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-semibold'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-zinc-100 font-semibold">Confirm Dialog</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Show end confirmation</span>
                </button>
              </div>

              <div className="pt-1.5 flex items-center justify-between">
                <span className="text-[11px] text-zinc-500">
                  Shortcut: <kbd className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400">Alt + K</kbd>
                </span>
                <button
                  type="button"
                  onClick={onTestShakeHaptic}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                  aria-label="Test shake haptic vibration pattern"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Test Shake Vibration</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audio Earcons Toggle */}
        <div className="py-3.5 border-b border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                <span>Auditory Feedback & Earcons</span>
              </span>
              <p className="text-xs text-zinc-400">
                Plays distinct melodic and percussive sound cues for knocks, door openings, message send/receive, and destruction.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={soundEnabled}
              onClick={onToggleSound}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                soundEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Spoken Voice Prompts Toggle */}
        {onToggleVoice && (
          <div className="py-3.5 border-b border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  <span>Spoken Voice Prompts (PWA & Guidance)</span>
                </span>
                <p className="text-xs text-zinc-400">
                  Speaks out loud instructions when the app is ready to install, steps for iOS Safari, and action confirmations.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={voiceEnabled}
                onClick={onToggleVoice}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  voiceEnabled ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    voiceEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Reference */}
        <div className="py-4 border-b border-zinc-800 space-y-3">
          <h3 className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard Shortcuts</span>
          </h3>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">Accessibility Guide</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Alt + A</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">Toggle High Contrast</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Alt + C</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">Toggle Haptic Feedback</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Alt + H</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">Install PWA (Voice Guided)</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Alt + I</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">Toggle Audio Cues</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Alt + S</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">Privacy Shield Lock</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Alt + L</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">End Chat Dialog</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Alt + E</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">Send Message</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Enter</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">New Line in Chat</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Shift + Enter</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">Close / Cancel</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Escape</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">Shake Gesture Panic Wipe</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Alt + K</dd>
            </div>

            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between">
              <dt className="text-zinc-300">Shutter / Snap Photo</dt>
              <dd className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-emerald-400">Space</dd>
            </div>
          </dl>
        </div>

        {/* Screen Reader Optimization Features */}
        <div className="pt-4 space-y-2 text-xs text-zinc-300">
          <h3 className="font-semibold text-zinc-100 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Screen Reader & Tactile Features:</span>
          </h3>
          <ul className="list-disc pl-5 space-y-1 text-zinc-400">
            <li><strong className="text-zinc-200">Device Shake Panic Wipe:</strong> Deliberately shaking your phone triggers an immediate end conversation or clear history panic wipe, accompanied by urgent Haptic API tactile pulses.</li>
            <li><strong className="text-zinc-200">Tactile Haptics:</strong> Dynamic vibration pulses for button presses, message arrivals, knocks, and shutters so you feel physical confirmation.</li>
            <li><strong className="text-zinc-200">High Contrast Mode:</strong> Pure white text on solid black with 2px thick white borders and high-visibility focus indicators.</li>
            <li><strong className="text-zinc-200">Voice-Guided PWA Installation:</strong> Spoken audio voice prompts announce when the app is ready to download, guide iOS Safari installation, and confirm completion.</li>
            <li>Instant live announcements for knocking guests, admissions, incoming chats, and peer typing.</li>
            <li>Accessible temporary camera capture with audio descriptions (alt text) so blind users can take, review, and describe photos.</li>
            <li>Timestamped and structured message log (`role="log"`) read sequentially with auto-destruct countdowns.</li>
            <li>No visual-only traps: all status indicators have descriptive text equivalents.</li>
          </ul>
        </div>

        {/* Dismiss Button */}
        <div className="pt-5 mt-auto">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition focus-visible:ring-2 focus-visible:ring-emerald-300 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
