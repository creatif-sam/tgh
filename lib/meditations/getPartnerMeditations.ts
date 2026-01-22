// lib/meditations/getPartnerMeditations.ts
import { createClient } from '@/lib/supabase/client'

export async function getPartnerMeditations() {
  const supabase = createClient()

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, partner_id')
    .eq('id', auth.user.id)
    .single()

  if (!profile) return null

  const userIds = profile.partner_id
    ? [profile.id, profile.partner_id]
    : [profile.id]

  const { data: meditations } = await supabase
    .from('meditations')
    .select('author_id, created_at, period')
    .in('author_id', userIds)

  return {
    meId: profile.id,
    partnerId: profile.partner_id,
    meditations: meditations ?? [],
  }
}
