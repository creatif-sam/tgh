'use client'

import { Card } from '@/components/ui/card'
import { Clock, Calendar, Target, Award } from 'lucide-react'
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
    <div className="grid grid-cols-2 gap-4 transition-colors duration-300">
      <StatCard
        icon={<Clock className="w-4 h-4 text-red-600 dark:text-red-400" />}
        iconBg="bg-red-50 dark:bg-red-950/30"
        label="Due Today"
        value={stats.todayDue}
      />

      <StatCard
        icon={<Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />}
        iconBg="bg-violet-50 dark:bg-violet-950/30"
        label="This Week"
        value={stats.weekActive}
      />

      <StatCard
        icon={<Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-emerald-50 dark:bg-emerald-950/30"
        label="This Month"
        value={stats.monthActive}
      />

      <StatCard
        icon={<Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
        iconBg="bg-blue-50 dark:bg-blue-950/30"
        label="This Year"
        value={stats.yearActive}
      />
    </div>
  )
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: number
}) {
  return (
    <Card className="p-4 flex flex-col gap-3 border-none shadow-sm bg-card dark:bg-zinc-900/50 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-xl ${iconBg} transition-colors`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>

      <div className="text-2xl font-black text-foreground">
        {value}
      </div>
    </Card>
  )
}