'use client'

import { Card } from '@/components/ui/card'
import { Clock, Calendar, Target } from 'lucide-react'
import { Goal } from '@/lib/types'

/* =========================
   HELPER FUNCTION
   ========================= */

export function computeDashboardStats(goals: Goal[]) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())

  const month = today.getMonth()
  const year = today.getFullYear()

  let todayDue = 0
  let weekActive = 0
  let monthActive = 0
  let yearActive = 0

  for (const g of goals) {
    if (!g.due_date) continue

    const d = new Date(g.due_date)
    d.setHours(0, 0, 0, 0)

    if (d.getTime() === today.getTime()) {
      todayDue++
    }

    if (d >= weekStart) weekActive++
    if (d.getMonth() === month) monthActive++
    if (d.getFullYear() === year) yearActive++
  }

  return {
    todayDue,
    weekActive,
    monthActive,
    yearActive,
  }
}

/* =========================
   COMPONENT
   ========================= */

export default function DashboardStats({
  stats,
}: {
  stats: {
    todayDue: number
    weekActive: number
    monthActive: number
    yearActive: number
  }
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard
        icon={<Clock className="w-5 h-5 text-red-600" />}
        label="Due Today"
        value={stats.todayDue}
      />

      <StatCard
        icon={<Calendar className="w-5 h-5 text-violet-600" />}
        label="This Week"
        value={stats.weekActive}
      />

      <StatCard
        icon={<Target className="w-5 h-5 text-emerald-600" />}
        label="This Month"
        value={stats.monthActive}
      />

      <StatCard
        icon={<Target className="w-5 h-5 text-blue-600" />}
        label="This Year"
        value={stats.yearActive}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <Card className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm font-medium">
          {label}
        </span>
      </div>

      <div className="text-2xl font-semibold">
        {value}
      </div>
    </Card>
  )
}
