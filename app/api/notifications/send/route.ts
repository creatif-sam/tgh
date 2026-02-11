import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

export async function POST(request: Request) {
  try {
    const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

    // 1. Check configuration immediately
    if (!PUBLIC_KEY || !PRIVATE_KEY) {
      console.error("VAPID Keys missing in environment");
      return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
    }

    // Configure web-push inside the request to ensure keys are loaded
    webpush.setVapidDetails('mailto:dev@gen116.com', PUBLIC_KEY, PRIVATE_KEY)

    const supabase = await createClient()
    const bodyData = await request.json()
    const { targetUserId, title, body, url } = bodyData

    // 2. Verify sender
    const { data: { user: sender }, error: authError } = await supabase.auth.getUser()
    if (authError || !sender) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Get the Target User's subscription
    const { data: subData, error: dbError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (dbError || !subData) {
      return NextResponse.json({ error: 'Recipient not subscribed' }, { status: 404 })
    }

    // 4. PREPARE THE PAYLOAD & SUBSCRIPTION
    const payload = JSON.stringify({
      title: title || `SamUr: Message from ${sender.email}`,
      body: body || 'New update in SamUr',
      url: url || '/protected/posts'
    })

    // CRITICAL FIX: Ensure subscription is an object, not a string
    const pushSubscription = typeof subData.subscription === 'string' 
      ? JSON.parse(subData.subscription) 
      : subData.subscription

    // 5. SEND NOTIFICATION
    try {
      await webpush.sendNotification(pushSubscription, payload)
    } catch (pushErr: any) {
      console.error("WebPush Error Details:", pushErr.statusCode, pushErr.body)
      // If the subscription is no longer valid, we should ideally delete it here
      return NextResponse.json({ error: 'Push service rejected request' }, { status: 502 })
    }

    // 6. LOG IN DB (For in-app dropdown)
    await supabase.from('notifications').insert({
      user_id: targetUserId,
      type: 'message',
      title: title || 'New Notification',
      body: body || '',
      read: false
    })

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error("Global Route Error:", err)
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 })
  }
}