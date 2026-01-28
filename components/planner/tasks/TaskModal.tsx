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
  const [recurring, setRecurring] =
    useState<PlannerTask['recurring'] | null>(null)

  useEffect(() => {
    if (existingTask) {
      setText(existingTask.text)
      setEnd(parseInt(existingTask.end.split(':')[0]))
      setRecurring(existingTask.recurring ?? null)
    } else {
      setText('')
      setEnd(hour + 1)
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
      recurring: recurring ?? undefined,
    })
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-semibold mb-3">
        {existingTask ? 'Edit Task' : 'New Task'}
      </h3>

      <TaskBasics
        text={text}
        end={end}
        hour={hour}
        onTextChange={setText}
        onEndChange={setEnd}
      />

      <TaskRecurrence
        value={recurring}
        onChange={setRecurring}
      />

      <button
        onClick={handleSave}
        className="mt-4 w-full bg-violet-600 text-white rounded-lg py-2"
      >
        Save1
      </button>
    </Modal>
  )
}
