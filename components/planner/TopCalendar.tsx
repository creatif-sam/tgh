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
      {/* Prev */}
      <button
        onClick={() => navigate(-1)}
        className="p-2 border rounded shrink-0"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Days */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-1">
        {days.map((day) => {
          const active = sameDay(day, selectedDate)

          return (
            <button
              key={day.toDateString()}
              onClick={() => onChange(day)}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center rounded-full border text-sm shrink-0 ${
                active
                  ? 'bg-violet-600 text-white'
                  : 'bg-background text-muted-foreground'
              }`}
            >
              <div className="text-[10px] leading-none">
                {day.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className="font-medium leading-none">
                {day.getDate()}
              </div>
            </button>
          )
        })}
      </div>

      {/* Calendar picker */}
      <button
        onClick={() => dateInputRef.current?.showPicker()}
        className="p-2 border rounded shrink-0"
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

      {/* Next */}
      <button
        onClick={() => navigate(1)}
        className="p-2 border rounded shrink-0"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
