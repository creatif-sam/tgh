'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export default function ProgressOverview({
  completedToday,
  todayTasks,
  completedGoals,
  totalGoals,
}: {
  completedToday: number
  todayTasks: number
  completedGoals: number
  totalGoals: number
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBlock
          label="Today's Tasks"
          current={completedToday}
          total={todayTasks}
        />
        <ProgressBlock
          label="All Goals"
          current={completedGoals}
          total={totalGoals}
        />
      </CardContent>
    </Card>
  )
}

function ProgressBlock({
  label,
  current,
  total,
}: {
  label: string
  current: number
  total: number
}) {
  const value =
    total > 0 ? (current / total) * 100 : 0

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>
          {current}/{total}
        </span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  )
}
