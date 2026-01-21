'use client'

import { PlannerTask } from './DailyPlanner'
import { ListChecks, Clock, Trophy } from 'lucide-react'

const HOURS_START = 5
const HOURS_END = 23

interface DaySummaryProps {
  tasks: PlannerTask[]
}

export default function DaySummary({ tasks }: DaySummaryProps) {
  function parseMinutes(time: string) {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + (m || 0)
  }

  const totalDayMinutes = (HOURS_END - HOURS_START) * 60

  const taskDurations = tasks.map((task) => ({
    ...task,
    duration: parseMinutes(task.end) - parseMinutes(task.start),
  }))

  const busyMinutes = taskDurations.reduce(
    (sum, task) => sum + task.duration,
    0
  )

  const freeMinutes = Math.max(totalDayMinutes - busyMinutes, 0)
  const freeHours = (freeMinutes / 60).toFixed(1)

  const longestTask =
    taskDurations.length > 0
      ? taskDurations.reduce((a, b) =>
          b.duration > a.duration ? b : a
        )
      : null

return (
  <div className="flex items-start gap-8 rounded-xl border p-4 overflow-hidden">
    <div className="flex items-center gap-3">
      <ListChecks className="opacity-70" size={20} />
      <div>
        <div className="text-xl font-semibold">
          {tasks.length}
        </div>
        <div className="text-sm text-muted-foreground">
          Activities
        </div>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <Clock className="opacity-70" size={20} />
      <div>
        <div className="text-xl font-semibold">
          {freeHours}
        </div>
        <div className="text-sm text-muted-foreground">
          Free Hours
        </div>
      </div>
    </div>

    <div className="flex items-start gap-3">
      <Trophy className="opacity-70 mt-1" size={20} />
      <div>
        <div className="text-sm font-medium">
          Longest Task
        </div>

        {longestTask ? (
          <>
            <div className="font-semibold">
              {longestTask.text}
            </div>
            <div className="text-xs text-muted-foreground">
              {longestTask.start} to {longestTask.end}
            </div>
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            No tasks scheduled
          </div>
        )}
      </div>
    </div>
  </div>
)
}