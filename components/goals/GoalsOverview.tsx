'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Goal } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

interface GoalCategory {
  id: string
  name: string
  color: string
  emoji: string | null
}

export function GoalsOverview({
  goals,
  categories,
}: {
  goals: Goal[]
  categories: GoalCategory[]
}) {
  const router = useRouter()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayGoals = goals.filter((g) => {
    if (!g.due_date) return false
    const d = new Date(g.due_date)
    d.setHours(0, 0, 0, 0)
    return d.getTime() === today.getTime()
  })

  const completed = goals.filter(
    (g) => g.status === 'done'
  ).length

  const completionRate =
    goals.length === 0
      ? 0
      : Math.round((completed / goals.length) * 100)

  const pieData = (() => {
    const map: Record<string, number> = {}

    goals.forEach((g: any) => {
      if (!g.category_id) return
      map[g.category_id] =
        (map[g.category_id] ?? 0) + 1
    })

    return Object.entries(map).map(
      ([categoryId, value]) => {
        const cat = categories.find(
          (c) => c.id === categoryId
        )
        return {
          name: cat?.name ?? 'Uncategorized',
          value,
          color: cat?.color ?? '#8884d8',
          emoji: cat?.emoji ?? '📌',
        }
      }
    )
  })()

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-lg font-semibold">
            Overview
          </h2>
          <p className="text-xs text-muted-foreground">
            Progress snapshot and today focus.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => router.push('/protected/goals/daily')}
        >
          Go to Today
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total Goals" value={goals.length} />
        <KPI label="Completed" value={completed} />
        <KPI label="Completion Rate" value={`${completionRate}%`} />
        <KPI
          label="Due Today"
          value={todayGoals.length}
          highlight={todayGoals.length > 0}
        />
      </div>

      {/* TODAY PREVIEW */}
      <div className="border rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">
            Today
          </h3>
          {todayGoals.length > 0 && (
            <button
              className="text-xs underline text-muted-foreground"
              onClick={() =>
                router.push('/protected/goals/daily')
              }
            >
              View all
            </button>
          )}
        </div>

        {todayGoals.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No goals due today
          </div>
        ) : (
          <ul className="space-y-2">
            {todayGoals.slice(0, 3).map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between border rounded-lg px-3 py-2 text-sm"
              >
                <span className="truncate">
                  {g.title}
                </span>
                <span
                  className={`text-xs ${
                    g.status === 'done'
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  {g.status.replace('_', ' ')}
                </span>
              </li>
            ))}

            {todayGoals.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{todayGoals.length - 3} more
              </div>
            )}
          </ul>
        )}
      </div>

      {/* CATEGORY CHART */}
      <div className="border rounded-xl p-4 space-y-4">
        {pieData.length > 0 ? (
          <>
            <div className="h-56">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                  >
                    {pieData.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              {pieData.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center gap-2"
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <span>
                    {c.emoji} {c.name}
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
            No goals yet
          </div>
        )}
      </div>
    </div>
  )
}

/* KPI helper */
function KPI({
  label,
  value,
  highlight,
}: {
  label: string
  value: string | number
  highlight?: boolean
}) {
  return (
    <div className="border rounded-xl p-4">
      <div className="text-xs text-muted-foreground">
        {label}
      </div>
      <div
        className={`text-2xl font-semibold ${
          highlight ? 'text-red-600' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}
