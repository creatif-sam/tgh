import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { notificationId, markAll } = await request.json()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)

  // Mark specific or all
  if (!markAll && notificationId) {
    query = query.eq('id', notificationId)
  } else {
    query = query.eq('read', false)
  }

  const { error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}