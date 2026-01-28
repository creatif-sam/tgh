'use client'

import { useEffect, useState } from 'react'
import { getPartnerMeditations } from '@/lib/meditations/getPartnerMeditations'
import { reduceMeditations, calculateStreak } from '@/lib/meditations/reducer'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function PartnerMeditationBoard() {
  const [data, setData] = useState<any>(null)

  async function load() {
    const res = await getPartnerMeditations()
    if (!res) return

    const reduced = reduceMeditations(res.meditations)
    const todayKey = new Date().toISOString().slice(0, 10)

    const meDays = reduced[res.meId] ?? {}
    const partnerDays = res.partnerId
      ? reduced[res.partnerId] ?? {}
      : {}

    setData({
      me: {
        name: res.meName ?? 'You',
        avatar: res.meAvatar,
        streak: calculateStreak(meDays),
        today: meDays[todayKey],
      },
      partner: res.partnerId
        ? {
            name: res.partnerName ?? 'Partner',
            avatar: res.partnerAvatar,
            streak: calculateStreak(partnerDays),
            today: partnerDays[todayKey],
          }
        : null,
    })
  }

  useEffect(() => {
    load()
  }, [])

  if (!data) return null

  return (
    <div className="grid grid-cols-2 gap-4">
      <PersonCard data={data.me} />
      {data.partner && <PersonCard data={data.partner} />}
    </div>
  )
}

function PersonCard({ data }: any) {
  const doneToday = data?.today
  const streak = data.streak

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Avatar name={data.name} avatar={data.avatar} />
        <h3 className="font-semibold truncate">{data.name}</h3>
      </div>

      <div className="flex items-center gap-2">
        {streak >= 3 ? (
          <motion.span
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            🔥
          </motion.span>
        ) : (
          <span>{streak > 0 ? '🔥' : '😈'}</span>
        )}
        <span className="text-sm">{streak} day streak</span>
      </div>

      <div className="flex gap-1">
        <div
          className={`flex-1 h-2 rounded ${
            doneToday?.morning ? 'bg-amber-400' : 'bg-muted'
          }`}
        />
        <div
          className={`flex-1 h-2 rounded ${
            doneToday?.evening ? 'bg-violet-500' : 'bg-muted'
          }`}
        />
      </div>
    </div>
  )
}

function Avatar({
  name,
  avatar,
}: {
  name: string
  avatar?: string | null
}) {
  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name}
        width={36}
        height={36}
        className="rounded-full object-cover"
      />
    )
  }

  return (
    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
      {name.slice(0, 1).toUpperCase()}
    </div>
  )
}
