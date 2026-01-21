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
    <div className="rounded-xl border p-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
      {/* Activities */}
      <div className="flex items-center gap-3">
        <ListChecks className="opacity-70" size={18} />
        <div>
          <div className="text-lg sm:text-xl font-semibold">
            {tasks.length}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            Activities
          </div>
        </div>
      </div>

      {/* Free hours */}
      <div className="flex items-center gap-3">
        <Clock className="opacity-70" size={18} />
        <div>
          <div className="text-lg sm:text-xl font-semibold">
            {freeHours}
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground">
            Free Hours
          </div>
        </div>
      </div>

      {/* Longest task */}
      <div className="flex items-start gap-3">
        <Trophy className="opacity-70 mt-0.5" size={18} />
        <div className="max-w-full">
          <div className="text-xs sm:text-sm font-medium">
            Longest Task
          </div>

          {longestTask ? (
            <>
              <div className="font-semibold text-sm sm:text-base break-words">
                {longestTask.text}
              </div>
              <div className="text-xs text-muted-foreground">
                {longestTask.start} to {longestTask.end}
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground">
              No tasks scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
