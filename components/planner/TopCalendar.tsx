'use client'

import { useMemo, useRef } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface TopCalendarProps {
  selectedDate: Date
  onChange: (date: Date) => void
}

export default function TopCalendar({
  selectedDate,
  onChange,
}: TopCalendarProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)

  const days = useMemo(() => {
    const base = new Date(selectedDate)
    const start = new Date(base)
    start.setDate(base.getDate() - 3)

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [selectedDate])

  function sameDay(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  function navigate(dir: number) {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + dir)
    onChange(d)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(-1)}
        className="px-2 py-1 border rounded"
      >
        <ChevronLeft size={16} />
      </button>

      <div className="flex gap-2">
        {days.map((day) => {
          const active = sameDay(day, selectedDate)

          return (
            <button
              key={day.toDateString()}
              onClick={() => onChange(day)}
              className={`w-12 h-12 flex flex-col items-center justify-center border rounded-full text-sm ${
                active
                  ? 'bg-violet-600 text-white'
                  : 'bg-background text-muted-foreground'
              }`}
            >
              <div className="text-[11px] leading-none">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className="font-medium leading-none">
                {day.getDate()}
              </div>
            </button>
          )
        })}
      </div>

      <button
        onClick={() => dateInputRef.current?.showPicker()}
        className="px-2 py-1 border rounded"
      >
        <Calendar size={16} />
      </button>

      <input
        ref={dateInputRef}
        type="date"
        value={selectedDate.toISOString().split('T')[0]}
        onChange={(e) => onChange(new Date(e.target.value))}
        className="sr-only"
      />

      <button
        onClick={() => navigate(1)}
        className="px-2 py-1 border rounded"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
