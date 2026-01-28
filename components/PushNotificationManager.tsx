'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Bell, BellOff, Settings } from 'lucide-react'
import { toast } from 'sonner'

interface NotificationPreferences {
  messages: boolean
  planner_reminders: boolean
  goal_deadlines: boolean
  goal_progress: boolean
  posts: boolean
}

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    messages: true,
    planner_reminders: true,
    goal_deadlines: true,
    goal_progress: true,
    posts: true
  })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false)
      setLoading(false)
      return
    }

    setPermission(Notification.permission)

    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    setIsSubscribed(!!existing)

    await loadPreferences()
    setLoading(false)
  }

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) {
      setPreferences({
        messages: data.messages,
        planner_reminders: data.planner_reminders,
        goal_deadlines: data.goal_deadlines,
        goal_progress: data.goal_progress,
        posts: data.posts
      })
    }
  }

  const enableNotifications = async () => {
    if (permission !== 'granted') {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') {
        toast.error('Notification permission denied')
        return
      }
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidKey) {
        toast.error('Missing VAPID public key')
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        subscription
      })

      await supabase.from('notification_preferences').upsert({
        user_id: user.id,
        ...preferences
      })

      setIsSubscribed(true)
      toast.success('Notifications enabled')
    } catch {
      toast.error('Failed to enable notifications')
    }
  }

  const disableNotifications = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint)
      }

      setIsSubscribed(false)
      toast.success('Notifications disabled')
    } catch {
      toast.error('Failed to disable notifications')
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const updated = { ...preferences, [key]: value }
    setPreferences(updated)

    await supabase.from('notification_preferences').upsert({
      user_id: user.id,
      ...updated
    })
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
  }

  if (loading) return <div>Loading notification settings</div>

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notifications not supported on this browser</CardTitle>
        </CardHeader>
      </Card>
    )
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
        <div className="flex items-center justify-between">
          <div>
            <Label>Push Notifications</Label>
            <p className="text-sm text-muted-foreground">
              {permission !== 'granted'
                ? 'Permission required'
                : isSubscribed
                ? 'Enabled'
                : 'Disabled'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={enableNotifications}>
              <Bell className="h-4 w-4 mr-2" />
              Enable
            </Button>

            <Button variant="outline" onClick={disableNotifications}>
              <BellOff className="h-4 w-4 mr-2" />
              Disable
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(preferences).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between">
              <Label>{key.replace('_', ' ')}</Label>
              <Switch
                checked={value}
                disabled={!isSubscribed}
                onCheckedChange={v => updatePreference(key as keyof NotificationPreferences, v)}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
