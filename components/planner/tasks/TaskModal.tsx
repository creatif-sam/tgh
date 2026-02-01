'use client'

import { useEffect, useState } from 'react'
import type { PlannerTask } from '../DailyPlanner'
import { TaskBasics } from './TaskBasics'
import { TaskRecurrence } from './TaskRecurrence'
import { Modal } from './Modal'
import { Clock, ArrowRight, X, Calendar as CalendarIcon } from 'lucide-react'

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
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [visionId, setVisionId] = useState<string | null>(null)
  const [recurring, setRecurring] = useState<PlannerTask['recurring'] | null>(null)

  useEffect(() => {
    if (existingTask) {
      setText(existingTask.text)
      setStartTime(existingTask.start)
      setEndTime(existingTask.end)
      setVisionId(existingTask.vision_id ?? null)
      setRecurring(existingTask.recurring ?? null)
    } else {
      const hStart = hour.toString().padStart(2, '0')
      const hEnd = (hour + 1).toString().padStart(2, '0')
      setStartTime(`${hStart}:00`)
      setEndTime(`${hEnd}:00`)
    }
  }, [existingTask, hour])

  function getDurationLabel() {
    const [sH, sM] = startTime.split(':').map(Number)
    const [eH, eM] = endTime.split(':').map(Number)
    let diff = (eH * 60 + eM) - (sH * 60 + sM)
    if (diff < 0) diff += 1440 
    const h = Math.floor(diff / 60)
    const m = diff % 60
    return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}` : `${m}m`
  }

  return (
    <Modal onClose={onClose}>
      {/* WIDER CONTAINER: max-w-4xl (900px) on PC */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        
        {/* Header - Wide Style */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-start border-b border-slate-50 dark:border-slate-800">
          <div className="flex-1">
            <input
              autoFocus
              type="text"
              placeholder="Communion with the Great..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-slate-200 dark:placeholder:text-slate-700 dark:text-white"
            />
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mt-1">
              {existingTask ? 'Modify Existing Event' : 'Planning New Activity'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full ml-4">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* 2-COLUMN CONTENT: Side by side on PC, stacked on Mobile */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* LEFT COLUMN: Time & Vision */}
          <div className="space-y-8">
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[24px] p-6 border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} /> Timeline
                </label>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
                  {getDurationLabel()}
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <input type="time" value={startTime} onChange={(e)=>setStartTime(e.target.value)} className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-3 text-xl font-bold text-center border border-slate-200 dark:border-slate-600 dark:text-white" />
                <ArrowRight className="text-slate-300" />
                <input type="time" value={endTime} onChange={(e)=>setEndTime(e.target.value)} className="flex-1 bg-white dark:bg-slate-800 rounded-xl p-3 text-xl font-bold text-center border border-slate-200 dark:border-slate-600 dark:text-white" />
              </div>
            </div>

            <TaskBasics
              text={text}
              visionId={visionId}
              onTextChange={setText}
              onVisionChange={setVisionId}
              hideTitle={true}
            />
          </div>

          {/* RIGHT COLUMN: Recurrence */}
          <div className="lg:border-l lg:pl-10 lg:border-slate-100 lg:dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <CalendarIcon size={14} /> Recurrence Rules
            </div>
            <TaskRecurrence
              value={recurring}
              onChange={setRecurring}
            />
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/20 flex flex-col md:flex-row gap-4 justify-end">
          <button onClick={onClose} className="px-8 py-3 text-sm font-bold text-slate-400 hover:text-slate-600">
            Discard
          </button>
          <button 
            onClick={() => text.trim() && onSave({ id: existingTask?.id ?? crypto.randomUUID(), text, start: startTime, end: endTime, completed: existingTask?.completed ?? false, vision_id: visionId ?? undefined, recurring: recurring ?? undefined })}
            className={`px-12 py-4 rounded-2xl font-bold text-sm shadow-lg transition-all ${text.trim() ? 'bg-blue-600 text-white hover:scale-[1.02] shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {existingTask ? 'Save Changes' : 'Confirm Plan'}
          </button>
        </div>
      </div>
    </Modal>
  )
}