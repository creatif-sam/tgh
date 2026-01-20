'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function ServiceWorkerRegistration() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      setIsStandalone(isStandaloneMode);
      console.log('Is standalone:', isStandaloneMode);
    };

    // Check if device is iOS
    const checkIOS = () => {
      const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const iPadOS = navigator.userAgent.includes("Mac") && "ontouchend" in document;
      setIsIOS(iOS || iPadOS);
      console.log('Is iOS:', iOS || iPadOS);
    };

    checkStandalone();
    checkIOS();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
          // Check if the SW is controlling the page
          if (navigator.serviceWorker.controller) {
            console.log('SW is controlling the page');
          } else {
            console.log('SW is not yet controlling the page');
          }
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setIsInstallable(false);
      setIsStandalone(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // iOS installation instructions
      alert('To install this app on iOS:\n1. Tap the Share button (📤)\n2. Select "Add to Home Screen"\n3. Tap "Add"');
      return;
    }

    if (deferredPrompt) {
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      // Fallback: show instructions
      alert('To install this app:\n1. Open in Chrome/Edge\n2. Click the menu (three dots)\n3. Select "Install TGH" or "Add to Home Screen"');
    }
  };

  return (
    <div>
      {!isStandalone && (
        <button
          onClick={handleInstallClick}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            padding: '12px',
            borderRadius: '50%',
            border: 'none',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px'
          }}
          title={
            isIOS
              ? 'Add to Home Screen (iOS)'
              : deferredPrompt
                ? 'Install App'
                : 'How to Install'
          }
        >
          <Download size={20} />
        </button>
      )}
    </div>
  );
}