import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pushNotificationService } from '@/lib/push-notifications'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content, visibility } = await req.json()

  let partnerId = null

  if (visibility === 'shared') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', user.id)
      .single()

    partnerId = profile?.partner_id
  }

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      content,
      visibility,
      author_id: user.id,
      partner_id: partnerId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  /* 🔔 SEND NOTIFICATION */
  if (partnerId && visibility === 'shared') {
    await pushNotificationService.sendToUser(
      partnerId,
      {
        title: 'New post from your partner',
        body: content.slice(0, 60),
        url: '/protected/posts',
      },
      'post'
    )
  }

  return NextResponse.json({ post })
}
