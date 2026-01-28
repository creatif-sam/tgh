import { NextRequest, NextResponse } from 'next/server'
import { pushNotificationService } from '@/lib/push-notifications'
import { createClient } from '@/lib/supabase/server'

/* SEND notification */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await request.json()
    const { type, title, body, data, url } = payload

    if (!type || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, body' },
        { status: 400 }
      )
    }

    const validTypes = [
      'message',
      'planner_reminder',
      'goal_deadline',
      'goal_progress',
      'post',
      'system'
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    /* always notify the authenticated user */
    await pushNotificationService.sendToUser(
      user.id,
      { title, body, data, url },
      type
    )

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/notifications failed', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/* FETCH notifications */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') ?? 50)
    const offset = Number(searchParams.get('offset') ?? 0)

    const notifications = await pushNotificationService.getUserNotifications(
      user.id,
      limit,
      offset
    )

    return NextResponse.json({ notifications })
  } catch (err) {
    console.error('GET /api/notifications failed', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
