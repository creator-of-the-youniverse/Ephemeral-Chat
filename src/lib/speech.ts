/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Accessible Speech Synthesis Voice Prompts
 * Delivers audible spoken voice prompts for installation, navigation, and accessibility
 * to complement screen reader announcements and earcons.
 */

const VOICE_STORAGE_KEY = 'privchat_voice_prompts_enabled';

export function isVoicePromptsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(VOICE_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export function setVoicePromptsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VOICE_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Speak a voice prompt through Web Speech API (speechSynthesis)
 */
export function speakVoicePrompt(
  text: string,
  options?: {
    force?: boolean;
    rate?: number;
    pitch?: number;
    volume?: number;
  }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!options?.force && !isVoicePromptsEnabled()) return;

  try {
    // Cancel any ongoing speech to avoid overlapping chatter
    window.speechSynthesis.cancel();

    const cleanText = text.trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.rate ?? 0.95; // Slightly measured rate for maximum cognitive accessibility
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const preferred =
        voices.find((v) => v.lang.startsWith('en') && v.default) ||
        voices.find((v) => v.lang.startsWith('en-US')) ||
        voices.find((v) => v.lang.startsWith('en'));
      if (preferred) {
        utterance.voice = preferred;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis unavailable:', err);
  }
}

/**
 * Stop any active speech prompt
 */
export function stopVoicePrompt(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}
