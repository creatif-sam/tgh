'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function NotificationTest() {
  const [status, setStatus] = useState<string>('Checking...');
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        setStatus('❌ Notifications not supported in this browser');
        return;
      }

      if (!('serviceWorker' in navigator)) {
        setStatus('❌ Service workers not supported');
        return;
      }

      if (!('PushManager' in window)) {
        setStatus('❌ Push messaging not supported');
        return;
      }

      setPermission(Notification.permission);

      // Check service worker
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setStatus('❌ Service worker not registered');
        return;
      }

      console.log('👷 Service worker registration:', registration);
      console.log('👷 Service worker active:', registration.active);
      console.log('👷 Service worker state:', registration.active?.state);

      // Check subscription
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      console.log('📡 Current subscription:', subscription);

      setStatus('✅ All requirements met');
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setStatus(`Permission: ${result}`);
    } catch (error) {
      setStatus(`❌ Permission error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testNotification = () => {
    if (permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test push notification!',
        icon: '/icon-192.png',
      });
    } else {
      setStatus('❌ Permission not granted');
    }
  };

  const testSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        setStatus('❌ VAPID key not found');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      setIsSubscribed(true);
      setStatus(`✅ Subscribed! Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
    } catch (error) {
      setStatus(`❌ Subscription error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testServerNotification = async () => {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      if (response.ok) {
        setStatus('✅ Server notification sent successfully! Check console for service worker logs (🔔 Push received).');
      } else {
        setStatus(`❌ Server error: ${result.error}`);
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createTestNotification = async () => {
    try {
      setStatus('Creating test notification...');
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'd86634a7-b569-4337-8d43-1bead49a235c', // Current user ID
          type: 'system',
          title: 'Test Notification',
          body: 'This is a test notification that appears in the bell dropdown!',
          data: { test: true },
        }),
      });

      if (response.ok) {
        setStatus('✅ Test notification created! Check the bell icon in the topbar.');
      } else {
        const error = await response.json();
        setStatus(`❌ Failed to create notification: ${error.error}`);
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetState = () => {
    setPermission('default');
    setIsSubscribed(false);
    setStatus('State reset - you can now test the full flow again');
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Notification Debug Test</h2>

      <div className="space-y-2">
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Permission:</strong> {permission}</p>
        <p><strong>Subscribed:</strong> {isSubscribed ? 'Yes' : 'No'}</p>
        <p><strong>VAPID Key:</strong> {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? 'Set' : 'Not set'}</p>
      </div>

      <div className="space-x-2">
        <Button onClick={checkStatus}>Check Status</Button>
        <Button onClick={requestPermission} disabled={permission === 'granted'}>
          Request Permission
        </Button>
        <Button onClick={testNotification} disabled={permission !== 'granted'}>
          Test Notification
        </Button>
        <Button onClick={testSubscription}>
          Test Subscription
        </Button>
        <Button onClick={testServerNotification} disabled={!isSubscribed}>
          Test Server Notification
        </Button>
        <Button onClick={createTestNotification}>
          Create Test Notification
        </Button>
        <Button onClick={resetState} variant="outline">
          Reset State
        </Button>
      </div>
    </div>
  );

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };
}