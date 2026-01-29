// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// import webpush from "npm:web-push"

// webpush.setVapidDetails(
//   "mailto:your-email@example.com",
//   Deno.env.get("VAPID_PUBLIC_KEY")!,
//   Deno.env.get("VAPID_PRIVATE_KEY")!
// )

// serve(async (req) => {
//   const { user_id, title, body, url } = await req.json()

//   // Initialize Admin Client (Service Role) to bypass RLS
//   const supabase = createClient(
//     Deno.env.get('SUPABASE_URL')!,
//     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
//   )

//   // 1. Get all active subscriptions for this user
//   const { data: subs } = await supabase
//     .from('push_subscriptions')
//     .select('subscription')
//     .eq('user_id', user_id)

//   if (!subs || subs.length === 0) return new Response("No subscriptions", { status: 200 });

//   // 2. Send to all devices
//   const sendPromises = subs.map(s => 
//     webpush.sendNotification(s.subscription, JSON.stringify({ title, body, url }))
//   )

//   await Promise.allSettled(sendPromises)
//   return new Response("Notifications sent", { status: 200 })
// })