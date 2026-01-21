'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreferences {
  messages: boolean;
  planner_reminders: boolean;
  goal_deadlines: boolean;
  goal_progress: boolean;
  posts: boolean;
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    messages: true,
    planner_reminders: true,
    goal_deadlines: true,
    goal_progress: true,
    posts: true,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    checkNotificationSupport();
    loadPreferences();
  }, []);

  const checkNotificationSupport = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Check if already subscribed
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        // Error handled silently
      }
    }
    setLoading(false);
  };

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setPreferences({
          messages: data.messages,
          planner_reminders: data.planner_reminders,
          goal_deadlines: data.goal_deadlines,
          goal_progress: data.goal_progress,
          posts: data.posts,
        });
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeToNotifications();
      } else {
        toast.error('Notification permission denied');
      }
    } catch (error) {
      toast.error('Failed to request notification permission');
    }
  };

  const subscribeToNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      // You'll need to get these from your server/backend
      // For now, using placeholder values - replace with actual VAPID keys
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BKxQzBJhBq8WJC8rQyQX8WJC8rQyQX8WJC8rQyQX8WJC8rQyQX8WJC8rQyQX8WJC8rQyQX8WJC8rQyQX8WJC8rQyQX';
      console.log('🔑 VAPID Public Key:', vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to server
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
          user_agent: navigator.userAgent,
        });

      if (error) {
        toast.error('Failed to save notification subscription');
      } else {
        setIsSubscribed(true);
        toast.success('Notifications enabled!');
      }
    } catch (error) {
      toast.error('Failed to subscribe to notifications');
    }
  };

  const unsubscribeFromNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        if (error) {
          // Error handled silently
        }
      }

      setIsSubscribed(false);
      toast.success('Notifications disabled');
    } catch (error) {
      toast.error('Failed to disable notifications');
    }
  };

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      // First try to update existing row
      const { data, error } = await supabase
        .from('notification_preferences')
        .update({
          [key]: value,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select();

      // If no row was updated (row doesn't exist), insert new row
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            ...newPreferences,
          });

        if (insertError) {
          toast.error('Failed to create notification preferences');
          return;
        }
      }

      if (error) {
        toast.error('Failed to update notification preferences');
      } else {
        toast.success('Notification preferences updated');
      }
    } catch (error) {
      toast.error('Failed to update notification preference');
    }
  };

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

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  if (loading) {
    return <div>Loading notification settings...</div>;
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in this browser. Try using a modern browser like Chrome, Firefox, or Edge.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission and Subscription Status */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                {permission === 'granted'
                  ? isSubscribed
                    ? 'Notifications are enabled'
                    : 'Permission granted, but not subscribed'
                  : permission === 'denied'
                    ? 'Permission denied - check browser settings'
                    : 'Permission required'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {permission === 'default' && (
                <Button onClick={requestPermission} size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Enable
                </Button>
              )}
              {permission === 'granted' && !isSubscribed && (
                <Button onClick={subscribeToNotifications} size="sm">
                  <Bell className="h-4 w-4 mr-2" />
                  Subscribe
                </Button>
              )}
              {isSubscribed && (
                <Button onClick={unsubscribeFromNotifications} variant="outline" size="sm">
                  <BellOff className="h-4 w-4 mr-2" />
                  Disable
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        {isSubscribed && (
          <div className="space-y-4">
            <Label className="text-base font-medium">Notification Types</Label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="messages" className="text-sm font-normal">
                  Messages
                </Label>
                <Switch
                  id="messages"
                  checked={preferences.messages}
                  onCheckedChange={(checked) => updatePreference('messages', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="planner" className="text-sm font-normal">
                  Planner Reminders
                </Label>
                <Switch
                  id="planner"
                  checked={preferences.planner_reminders}
                  onCheckedChange={(checked) => updatePreference('planner_reminders', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="deadlines" className="text-sm font-normal">
                  Goal Deadlines
                </Label>
                <Switch
                  id="deadlines"
                  checked={preferences.goal_deadlines}
                  onCheckedChange={(checked) => updatePreference('goal_deadlines', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="progress" className="text-sm font-normal">
                  Goal Progress Updates
                </Label>
                <Switch
                  id="progress"
                  checked={preferences.goal_progress}
                  onCheckedChange={(checked) => updatePreference('goal_progress', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="posts" className="text-sm font-normal">
                  New Posts
                </Label>
                <Switch
                  id="posts"
                  checked={preferences.posts}
                  onCheckedChange={(checked) => updatePreference('posts', checked)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}