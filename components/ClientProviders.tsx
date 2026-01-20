'use client';

import ServiceWorkerRegistration from './ServiceWorkerRegistration';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegistration />
      {children}
    </>
  );
}