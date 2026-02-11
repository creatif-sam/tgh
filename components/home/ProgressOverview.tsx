'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Trophy } from 'lucide-react'

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
    <Card className="border-none shadow-sm bg-card dark:bg-zinc-900/50 backdrop-blur-sm rounded-[24px] overflow-hidden transition-colors duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-foreground">
          <Trophy className="w-4 h-4 text-amber-500" />
          Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pb-6">
        <ProgressBlock
          label="Today's Tasks"
          current={completedToday}
          total={todayTasks}
          activeColor="bg-violet-600 dark:bg-violet-500"
        />
        <ProgressBlock
          label="All Goals"
          current={completedGoals}
          total={totalGoals}
          activeColor="bg-emerald-600 dark:bg-emerald-500"
        />
      </CardContent>
    </Card>
  )
}

function ProgressBlock({
  label,
  current,
  total,
  activeColor,
}: {
  label: string
  current: number
  total: number
  activeColor: string
}) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {label}
          </p>
          <p className="text-sm font-black text-foreground">
            {current} <span className="text-muted-foreground font-medium">/ {total} completed</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-lg font-black text-foreground">{percentage}%</span>
        </div>
      </div>
      
      <div className="relative h-2.5 w-full bg-secondary dark:bg-zinc-800 rounded-full overflow-hidden">
        {/* We use a div instead of the default Progress for more color control */}
        <div 
          className={`h-full ${activeColor} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}