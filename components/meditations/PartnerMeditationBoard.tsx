'use client'

import { useEffect, useState } from 'react'
import { getPartnerMeditations } from '@/lib/meditations/getPartnerMeditations'
import { reduceMeditations, calculateStreak } from '@/lib/meditations/reducer'
import { motion } from 'framer-motion'

export default function PartnerMeditationBoard() {
  const [data, setData] = useState<any>(null)

  async function load() {
    const res = await getPartnerMeditations()
    if (!res) return

    const reduced = reduceMeditations(res.meditations)

    const meDays = reduced[res.meId] ?? {}
    const partnerDays = res.partnerId ? reduced[res.partnerId] ?? {} : {}

    setData({
      me: {
        streak: calculateStreak(meDays),
        today: meDays[new Date().toISOString().slice(0, 10)],
      },
      partner: res.partnerId
        ? {
            streak: calculateStreak(partnerDays),
            today: partnerDays[new Date().toISOString().slice(0, 10)],
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
      <PersonCard label="You" data={data.me} />
      {data.partner && <PersonCard label="Partner" data={data.partner} />}
    </div>
  )
}

function PersonCard({ label, data }: any) {
  const doneToday = data?.today
  const streak = data.streak

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <h3 className="font-semibold">{label}</h3>

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
