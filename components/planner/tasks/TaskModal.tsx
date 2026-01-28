'use client'

import { useEffect, useState } from 'react'
import type { PlannerTask } from '../DailyPlanner'
import { TaskBasics } from './TaskBasics'
import { TaskRecurrence } from './TaskRecurrence'
import { Modal } from './Modal'

export function TaskModal({
  hour,
  existingTask,
  onClose,
  onSave,
}: {
  hour: number
  existingTask?: PlannerTask | null
  onClose: () => void
  onSave: (t: PlannerTask) => void
}) {
  const [text, setText] = useState('')
  const [end, setEnd] = useState(hour + 1)
  const [goalId, setGoalId] = useState<string | null>(null)
  const [recurring, setRecurring] =
    useState<PlannerTask['recurring'] | null>(null)

  useEffect(() => {
    if (existingTask) {
      setText(existingTask.text)
      setEnd(parseInt(existingTask.end.split(':')[0]))
      setGoalId(existingTask.goal_id ?? null)
      setRecurring(existingTask.recurring ?? null)
    } else {
      setText('')
      setEnd(hour + 1)
      setGoalId(null)
      setRecurring(null)
    }
  }, [existingTask, hour])

  function handleSave() {
    onSave({
      id: existingTask?.id ?? crypto.randomUUID(),
      text,
      start: `${hour}:00`,
      end: `${end}:00`,
      completed: existingTask?.completed ?? false,
      goal_id: goalId ?? undefined,
      recurring: recurring ?? undefined,
    })
  }

  return (
    <Modal onClose={onClose}>
      <div className="space-y-5">
        <h3 className="font-semibold">
          {existingTask ? 'Edit Task' : 'New Task'}
        </h3>

        <TaskBasics
          text={text}
          end={end}
          hour={hour}
          goalId={goalId}
          onTextChange={setText}
          onEndChange={setEnd}
          onGoalChange={setGoalId}
        />

        <TaskRecurrence
          value={recurring}
          onChange={setRecurring}
        />

        <button
          onClick={handleSave}
          className="w-full bg-violet-600 text-white rounded-lg py-2"
        >
          Save
        </button>
      </div>
    </Modal>
  )
}
