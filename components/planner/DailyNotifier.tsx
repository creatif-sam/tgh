'use client'

import { useEffect, useRef } from 'react'
import type { PlannerTask } from './DailyPlanner'

interface Props {
  tasks: PlannerTask[]
  date: Date
  notifyHour?: number
}

export default function DailySummaryNotifier({
  tasks,
  date,
  notifyHour = 21,
}: Props) {
  const lastNotifiedDateRef = useRef<string | null>(null)

  useEffect(() => {
    if (!('Notification' in window)) return

    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    const now = new Date()

    const todayKey = now.toISOString().split('T')[0]
    const selectedKey = date.toISOString().split('T')[0]

    if (todayKey !== selectedKey) return
    if (now.getHours() < notifyHour) return
    if (Notification.permission !== 'granted') return
    if (lastNotifiedDateRef.current === todayKey) return

    const completedTasks = tasks.filter((t) => t.completed)
    const totalTasks = tasks.length

    if (totalTasks === 0) return

    const audio = new Audio('/sounds/summary.mp3')
    audio.volume = 0.4
    audio.play().catch(() => {})

    new Notification('Daily Summary', {
      body: `You completed ${completedTasks.length} of ${totalTasks} tasks today`,
    })

    lastNotifiedDateRef.current = todayKey
  }, [tasks, date, notifyHour])

  return null
}
