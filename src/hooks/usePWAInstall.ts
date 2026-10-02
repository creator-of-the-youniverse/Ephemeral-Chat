import { useEffect, useState, useCallback, useRef } from 'react';
import { announce } from '../lib/announcer';
import { speakVoicePrompt } from '../lib/speech';
import { playInstallPromptChime, playInstallSuccess } from '../lib/sound';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const hasAnnouncedPromptRef = useRef(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsInstalled(isStandalone);

    // Detect iOS devices
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Trigger accessible voice prompt and chime once per session when app becomes installable
      if (!hasAnnouncedPromptRef.current && !isStandalone) {
        hasAnnouncedPromptRef.current = true;
        setTimeout(() => {
          playInstallPromptChime();
          const message = 'PrivaChat is available to download to your home screen. Press Alt plus I or activate Install App.';
          announce(message, 'polite');
          speakVoicePrompt(message);
        }, 1200);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      playInstallSuccess();
      const message = 'PrivaChat was successfully installed to your home screen.';
      announce(message, 'assertive');
      speakVoicePrompt(message);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        return false;
      }
      if (isInstalled) {
        const msg = 'PrivaChat is already installed and running as a standalone app.';
        announce(msg, 'polite');
        speakVoicePrompt(msg);
        return false;
      }
      const msg = 'To install PrivaChat, use your browser menu or check your address bar for the install icon.';
      announce(msg, 'polite');
      speakVoicePrompt(msg);
      return false;
    }

    try {
      speakVoicePrompt('Opening device app install confirmation...');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        playInstallSuccess();
        const successMsg = 'PrivaChat has been successfully installed. You can now open it directly from your device home screen.';
        announce(successMsg, 'assertive');
        speakVoicePrompt(successMsg);
        return true;
      } else {
        const cancelMsg = 'App installation was cancelled. You can install anytime by pressing Alt plus I.';
        announce(cancelMsg, 'polite');
        speakVoicePrompt(cancelMsg);
        return false;
      }
    } catch (err) {
      console.warn('PWA install error:', err);
      return false;
    }
  }, [deferredPrompt, isIOS, isInstalled]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
