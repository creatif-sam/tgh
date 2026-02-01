'use client'

import { useEffect } from 'react'

export function PushInitializer() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('SamUr Service Worker registered', reg.scope))
        .catch((err) => console.error('Service Worker failed', err));
    }
  }, []);

  return null; // This component doesn't render anything
}