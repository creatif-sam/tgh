'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Goal = {
  id: string
  title: string
}

export function TaskBasics({
  text,
  end,
  hour,
  goalId,
  onTextChange,
  onEndChange,
  onGoalChange,
}: {
  text: string
  end: number
  hour: number
  goalId: string | null
  onTextChange: (v: string) => void
  onEndChange: (v: number) => void
  onGoalChange: (v: string | null) => void
}) {
  const supabase = createClient()
  const [goals, setGoals] = useState<Goal[]>([])

  useEffect(() => {
    async function loadGoals() {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return

      const { data } = await supabase
        .from('goals')
        .select('id,title')
        .eq('owner_id', auth.user.id)
        .order('created_at')

      if (data) setGoals(data)
    }

    loadGoals()
  }, [supabase])

  const options = [
    { label: '30 min', value: hour + 0.5 },
    { label: '1 hour', value: hour + 1 },
    { label: '1.5 hours', value: hour + 1.5 },
    { label: '2 hours', value: hour + 2 },
    { label: '2.5 hours', value: hour + 2.5 },
    { label: '3 hours', value: hour + 3 },
    { label: '3.5 hours', value: hour + 3.5 },
    { label: '4 hours', value: hour + 4 },
  ]

  function formatTime(value: number) {
    const h = Math.floor(value)
    const m = value % 1 === 0.5 ? '30' : '00'
    return `${h}:${m}`
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Task
        </label>
        <input
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder="Task"
          className="w-full border rounded-lg p-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Link to goal
        </label>
        <select
          value={goalId ?? ''}
          onChange={(e) =>
            onGoalChange(e.target.value === '' ? null : e.target.value)
          }
          className="w-full border rounded-lg p-2 text-sm bg-white"
        >
          <option value="">No goal linked</option>
          {goals.map((goal) => (
            <option key={goal.id} value={goal.id}>
              {goal.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Duration
        </label>
        <select
          value={end}
          onChange={(e) => onEndChange(Number(e.target.value))}
          className="w-full border rounded-lg p-2 text-sm"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Ends at {formatTime(opt.value)} ({opt.label})
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
