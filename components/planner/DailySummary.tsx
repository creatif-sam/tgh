'use client'

import { PlannerTask } from './DailyPlanner'
import { ListChecks, Clock, Trophy, CheckCircle2, Lightbulb } from 'lucide-react'

const HOURS_START = 5
const HOURS_END = 23

interface DaySummaryProps {
  tasks: PlannerTask[]
  completedTaskIds: string[]
  visions?: Record<string, { title: string; emoji: string }>
}

export default function DaySummary({ tasks, completedTaskIds, visions }: DaySummaryProps) {
  function parseMinutes(time: string) {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + (m || 0)
  }

  const totalDayMinutes = (HOURS_END - HOURS_START) * 60

  const taskDurations = tasks.map((task) => ({
    ...task,
    duration: parseMinutes(task.end) - parseMinutes(task.start),
  }))

  const busyMinutes = taskDurations.reduce((sum, task) => sum + task.duration, 0)
  const freeMinutes = Math.max(totalDayMinutes - busyMinutes, 0)
  const freeHours = (freeMinutes / 60).toFixed(1)

  const completedCount = tasks.filter(t => completedTaskIds.includes(t.id)).length
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const longestTask = taskDurations.length > 0
      ? taskDurations.reduce((a, b) => b.duration > a.duration ? b : a)
      : null

  // SMART SUGGESTION LOGIC
  const getSuggestion = () => {
    if (freeMinutes <= 30) return "Schedule is tight. Focus on excellence in current tasks."
    
    // Find a vision that isn't heavily represented in today's tasks
    if (visions) {
      const visionIds = Object.keys(visions)
      const usedVisionIds = tasks.map(t => t.vision_id).filter(Boolean)
      const unusedVision = visionIds.find(id => !usedVisionIds.includes(id))
      
      if (unusedVision) {
        return `You have ${freeHours}h free. Why not spend 30m on "${visions[unusedVision].emoji} ${visions[unusedVision].title}"?`
      }
    }
    
    return `Great window of ${freeHours}h found. Use it for deep reflection or rest.`
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="flex flex-wrap items-start gap-6 sm:gap-12">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="text-blue-500 opacity-80" size={20} />
          <div>
            <div className="text-lg sm:text-xl font-bold tracking-tight">{completionRate}%</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Progress</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ListChecks className="text-slate-400 opacity-70" size={20} />
          <div>
            <div className="text-lg sm:text-xl font-bold tracking-tight">{tasks.length}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activities</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="text-slate-400 opacity-70" size={20} />
          <div>
            <div className="text-lg sm:text-xl font-bold tracking-tight">{freeHours}h</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Free Time</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-500 transition-all duration-1000 ease-out rounded-full"
          style={{ width: `${completionRate}%` }}
        />
      </div>

      {/* Smart Suggestion Section */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 rounded-[20px] p-4 flex items-start gap-3">
        <Lightbulb className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={18} />
        <div>
          <p className="text-[10px] font-bold text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest mb-1">Smart Suggestion</p>
          <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
            {getSuggestion()}
          </p>
        </div>
      </div>

      {/* Longest Task Footer */}
      <div className="pt-2 border-t border-slate-50 dark:border-slate-800/50 flex items-center gap-3">
        <Trophy className="text-amber-400 shrink-0" size={16} />
        <div className="min-w-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Focus:</span>
          {longestTask ? (
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
              {longestTask.text} ({longestTask.start} - {longestTask.end})
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium">Clear schedule</span>
          )}
        </div>
      </div>
    </div>
  )
}