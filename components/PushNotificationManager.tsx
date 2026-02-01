'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Bell, BellOff, Settings, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
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

  // Helper: Convert VAPID key to format browser understands
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const loadPreferences = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

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
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
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
      console.error("Notification Init error:", err)
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
        toast.error('SamUr needs permission to send reminders.')
        return
      }

      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidKey) throw new Error('VAPID Key not found in environment')

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Save subscription and initial preferences to Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        subscription: subscription.toJSON()
      })

      if (error) throw error

      setIsSubscribed(true)
      toast.success('PWA Notifications Activated')
    } catch (error) {
      console.error(error)
      toast.error('Could not activate notifications.')
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
      toast.success('Notifications Disabled')
    } catch (error) {
      toast.error('Error during unsubscription')
    } finally {
      setActionLoading(false)
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('notification_preferences').upsert({
      user_id: user.id,
      [key]: value
    })

    if (error) {
      toast.error('Failed to sync preference')
      setPreferences(prev => ({ ...prev, [key]: !value }))
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
      <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
    </div>
  )

  if (!isSupported) return (
    <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 rounded-3xl flex items-center gap-4">
      <AlertCircle className="text-amber-600 shrink-0" />
      <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Push is not supported on this browser or device.</p>
    </div>
  )

  return (
    <Card className="rounded-[32px] border-none shadow-xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black tracking-tight">SamUr Connect</CardTitle>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notification Control</p>
          </div>
          {permission === 'denied' && (
            <Badge variant="outline" className="text-red-500 border-red-100 bg-red-50">Blocked</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Toggle Card */}
        <div className={`p-5 rounded-[24px] border transition-all duration-500 ${isSubscribed ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base font-bold text-slate-900 dark:text-white">Real-Time Alerts</Label>
            <ShieldCheck className={isSubscribed ? 'text-blue-600' : 'text-slate-300'} size={20} />
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Enable to receive instant updates on your planner, visions, and partner messages even when the app is closed.
          </p>
          
          <Button 
            disabled={actionLoading || permission === 'denied'}
            onClick={isSubscribed ? unsubscribe : subscribe}
            className={`w-full rounded-2xl py-6 font-bold transition-all ${isSubscribed ? 'bg-white text-slate-900 border-slate-200 hover:bg-slate-100' : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700'}`}
          >
            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isSubscribed ? <BellOff className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
            {isSubscribed ? 'Stop Receiving Notifications' : 'Activate Push Notifications'}
          </Button>
        </div>

        {/* Categories */}
        <div className="space-y-3 px-1">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Settings</h4>
          <div className="space-y-2">
            {Object.entries(preferences).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="min-w-0">
                  <Label className="capitalize text-sm font-bold text-slate-800 dark:text-slate-200">
                    {key.replace(/_/g, ' ')}
                  </Label>
                  <p className="text-[11px] text-slate-400 truncate">Receive alerts for {key.replace(/_/g, ' ')} updates</p>
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
          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-tight">
            <AlertCircle size={14} />
            Browser permissions are blocked. Reset them in your site settings.
          </div>
        )}
      </CardContent>
    </Card>
  )
}