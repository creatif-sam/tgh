'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Settings, AlertCircle, Loader2 } from 'lucide-react'
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
  const [actionLoading, setActionLoading] = useState(false)

  const supabase = createClient()

  const loadPreferences = useCallback(async () => {
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
  }, [supabase])

  const init = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false)
      setLoading(false)
      return
    }

    setPermission(Notification.permission)

    try {
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      setIsSubscribed(!!existing)
      await loadPreferences()
    } catch (err) {
      console.error("Init error:", err)
    } finally {
      setLoading(false)
    }
  }, [loadPreferences])

  useEffect(() => {
    init()
  }, [init])

  const subscribe = async () => {
    setActionLoading(true)
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result !== 'granted') {
        toast.error('Permission denied. Please enable notifications in your browser settings.')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidKey) throw new Error('Missing VAPID key')

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await Promise.all([
        supabase.from('push_subscriptions').upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          subscription
        }),
        supabase.from('notification_preferences').upsert({
          user_id: user.id,
          ...preferences
        })
      ])

      setIsSubscribed(true)
      toast.success('You are now subscribed!')
    } catch (error) {
      toast.error('Failed to subscribe to push notifications')
    } finally {
      setActionLoading(false)
    }
  }

  const unsubscribe = async () => {
    setActionLoading(true)
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
      toast.success('Successfully unsubscribed')
    } catch (error) {
      toast.error('Error during unsubscription')
    } finally {
      setActionLoading(false)
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    // Optimistic Update
    setPreferences(prev => ({ ...prev, [key]: value }))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('notification_preferences').upsert({
      user_id: user.id,
      [key]: value
    })

    if (error) {
      toast.error('Failed to save preference')
      setPreferences(prev => ({ ...prev, [key]: !value })) // Revert
    }
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
  }

  if (loading) return (
    <Card className="border-none shadow-none bg-slate-50/50 dark:bg-slate-900/50">
      <CardContent className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </CardContent>
    </Card>
  )

  if (!isSupported) return (
    <Card className="border-amber-100 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
      <CardContent className="flex items-center gap-3 p-4 text-amber-800 dark:text-amber-400">
        <AlertCircle className="h-5 w-5" />
        <p className="text-sm font-medium">Push notifications are not supported on this browser.</p>
      </CardContent>
    </Card>
  )

  return (
    <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-blue-600" />
            Notification Preferences
          </CardTitle>
          {permission === 'denied' && (
            <Badge variant="destructive" className="animate-pulse">Blocked by Browser</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-8 pt-6">
        {/* Main Activation Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
          <div className="space-y-1">
            <Label className="text-base font-bold">Push Notifications</Label>
            <p className="text-sm text-slate-500">
              {isSubscribed ? 'Receiving notifications on this device' : 'Get real-time updates even when the app is closed'}
            </p>
          </div>
          
          <Button 
            disabled={actionLoading || permission === 'denied'}
            onClick={isSubscribed ? unsubscribe : subscribe}
            variant={isSubscribed ? "outline" : "default"}
            className={`rounded-full px-8 transition-all ${!isSubscribed && 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
          >
            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isSubscribed ? <BellOff className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
            {isSubscribed ? 'Disable' : 'Enable Now'}
          </Button>
        </div>

        {/* Detailed Toggles */}
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">Delivery Categories</h4>
          <div className="grid gap-0 divide-y divide-slate-100 dark:divide-slate-800 border-y border-slate-100 dark:border-slate-800">
            {Object.entries(preferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-4 px-1 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                <div className="space-y-0.5">
                  <Label className="capitalize text-sm font-semibold">{key.replace(/_/g, ' ')}</Label>
                  <p className="text-xs text-slate-400">Notify me about {key.replace(/_/g, ' ')}</p>
                </div>
                <Switch
                  checked={value}
                  disabled={!isSubscribed}
                  onCheckedChange={v => updatePreference(key as keyof NotificationPreferences, v)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            ))}
          </div>
        </div>

        {permission === 'denied' && (
          <p className="text-[11px] text-center text-slate-400 flex items-center justify-center gap-1">
            <AlertCircle size={12} />
            To re-enable, click the lock icon in your browser address bar.
          </p>
        )}
      </CardContent>
    </Card>
  )
}