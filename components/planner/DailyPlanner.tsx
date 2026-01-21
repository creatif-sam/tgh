'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  PlusCircle,
  CheckCircle,
  CheckCircle2,
  Pencil
} from 'lucide-react'
import { TaskModal } from './tasks/TaskModal'
import TopCalendar from './TopCalendar'
import DaySummary from './DailySummary'
import DailySummaryNotifier from './DailyNotifier'
import FreeTimeExportButton from './FreeTimeExportButton'

export interface PlannerTask {
  id: string
  text: string
  start: string
  end: string
  completed: boolean
  recurring?: {
    interval: number
    unit: 'day' | 'week'
    daysOfWeek: number[]
    until?: string
  }
}

const HOURS_START = 5
const HOURS_END = 23
const UPCOMING_REMINDER_MINUTES = 10

export default function DailyPlanner() {
  const supabase = createClient()

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState<PlannerTask[]>([])
  const [morning, setMorning] = useState('')
  const [reflection, setReflection] = useState('')
  const [taskModalHour, setTaskModalHour] = useState<number | null>(null)
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null)
  const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set())

  const dateKey = selectedDate.toISOString().split('T')[0]

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    loadDay()
  }, [dateKey])

  async function loadDay() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    const { data } = await supabase
      .from('planner_days')
      .select('tasks, morning, reflection')
      .eq('day', dateKey)
      .eq('user_id', auth.user.id)
      .maybeSingle()

    setTasks(Array.isArray(data?.tasks) ? data.tasks : [])
    setMorning(data?.morning ?? '')
    setReflection(data?.reflection ?? '')
    setNotifiedTasks(new Set())
  }

  async function saveDay(
    updatedTasks = tasks,
    updatedMorning = morning,
    updatedReflection = reflection
  ) {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    await supabase.from('planner_days').upsert(
      {
        day: dateKey,
        user_id: auth.user.id,
        tasks: updatedTasks,
        morning: updatedMorning,
        reflection: updatedReflection,
        visibility: 'private',
      },
      { onConflict: 'day,user_id' }
    )
  }

  function toggleComplete(taskId: string) {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    )
    setTasks(updated)
    saveDay(updated, morning, reflection)
  }

  function parseMinutes(time: string) {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + (m || 0)
  }

  function getNowMinutes() {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  }

  function getTaskStatus(task: PlannerTask) {
    const now = getNowMinutes()
    const start = parseMinutes(task.start)
    const end = parseMinutes(task.end)

    if (task.completed) return 'completed'
    if (now >= start && now < end) return 'ongoing'
    if (now < start) return 'upcoming'
    return 'past'
  }

  function notifyUpcoming(task: PlannerTask) {
    if (Notification.permission !== 'granted') return
    if (notifiedTasks.has(task.id)) return

    const now = getNowMinutes()
    const start = parseMinutes(task.start)
    const diff = start - now

    if (diff <= UPCOMING_REMINDER_MINUTES && diff > 0) {
      const audio = new Audio('/sounds/upcoming.mp3')
      audio.volume = 0.4
      audio.play().catch(() => {})

      new Notification('Upcoming Task', {
        body: `${task.text} starts in ${diff} minutes`,
      })

      setNotifiedTasks((prev) => new Set(prev).add(task.id))
    }
  }

  function getTaskClasses(task: PlannerTask) {
    const status = getTaskStatus(task)

    if (status === 'upcoming') {
      notifyUpcoming(task)
    }

    switch (status) {
      case 'ongoing':
        return 'bg-blue-600 text-white animate-ongoing transition-colors duration-500'
      case 'upcoming':
        return 'bg-yellow-500 text-black'
      case 'completed':
        return 'bg-green-600 text-white line-through'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="p-4 space-y-5 max-w-xl mx-auto">
      <DailySummaryNotifier tasks={tasks} date={selectedDate} />

      <div className="space-y-4">
        <TopCalendar
          selectedDate={selectedDate}
          onChange={setSelectedDate}
        />
        <DaySummary tasks={tasks} />
      </div>

      <FreeTimeExportButton
        tasks={tasks}
        date={selectedDate}
      />

      <div className="rounded-xl border p-3">
        <div className="text-sm font-medium mb-1">Morning Intention</div>
        <textarea
          value={morning}
          onChange={(e) => {
            setMorning(e.target.value)
            saveDay(tasks, e.target.value, reflection)
          }}
          rows={2}
          className="w-full border rounded-lg p-2 text-sm"
        />
      </div>

      <div className="space-y-2">
        {Array.from(
          { length: HOURS_END - HOURS_START },
          (_, i) => i + HOURS_START
        ).map((h) => (
          <div key={h} className="border rounded-lg p-2 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>{h}:00</span>
              <button
                onClick={() => setTaskModalHour(h)}
                className="flex items-center justify-center rounded-full border h-7 w-7 hover:bg-muted transition"
              >
                <PlusCircle size={18} className="opacity-70" />
              </button>
            </div>

            {tasks
              .filter(
                (t) =>
                  parseMinutes(t.start) <= h * 60 &&
                  parseMinutes(t.end) > h * 60
              )
              .map((t) => (
                <div
                  key={t.id}
                  className={`rounded-lg px-3 py-2 text-sm flex justify-between items-start gap-3 ${getTaskClasses(t)}`}
                >
                  <div>
                    {t.text}
                    <div className="text-xs opacity-80">
                      {t.start} to {t.end}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setEditingTask(t)}>
                      <Pencil size={16} className="opacity-80" />
                    </button>

                    <button onClick={() => toggleComplete(t.id)}>
                      {t.completed ? (
                        <CheckCircle2 size={20} />
                      ) : (
                        <CheckCircle size={20} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>

      <div className="rounded-xl border p-3">
        <div className="text-sm font-medium mb-1">Evening Reflection</div>
        <textarea
          value={reflection}
          onChange={(e) => {
            setReflection(e.target.value)
            saveDay(tasks, morning, e.target.value)
          }}
          rows={3}
          className="w-full border rounded-lg p-2 text-sm"
        />
      </div>

      {(taskModalHour !== null || editingTask) && (
        <TaskModal
          hour={
            editingTask
              ? parseInt(editingTask.start.split(':')[0])
              : taskModalHour!
          }
          existingTask={editingTask}
          onClose={() => {
            setTaskModalHour(null)
            setEditingTask(null)
          }}
          onSave={(task) => {
            const updated = editingTask
              ? tasks.map((t) => (t.id === task.id ? task : t))
              : [...tasks, task]

            setTasks(updated)
            saveDay(updated, morning, reflection)
            setTaskModalHour(null)
            setEditingTask(null)
          }}
        />
      )}
    </div>
  )
}
