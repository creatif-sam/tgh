'use client'

import React from 'react'

export function TaskBasics({
  text,
  end,
  hour,
  onTextChange,
  onEndChange,
}: {
  text: string
  end: number
  hour: number
  onTextChange: (v: string) => void
  onEndChange: (v: number) => void
}) {
  const options = [
    { label: '30 min', value: hour + 0.5 },
    { label: '1 hour', value: hour + 1 },
    { label: '1.5 hours', value: hour + 1.5 },
    { label: '2 hours', value: hour + 2 },
    { label: '2.5 hours', value: hour + 2.5 },
    { label: '3 hours', value: hour + 3 },
    { label: '3.5 hours', value: hour + 3.5 },
    { label: '4 hours', value: hour + 4 },
  ]

  function formatTime(value: number) {
    const h = Math.floor(value)
    const m = value % 1 === 0.5 ? '30' : '00'
    return `${h}:${m}`
  }

  return (
    <div className="space-y-2">
      <input
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Task"
        className="w-full border rounded-lg p-2 text-sm"
      />

      <select
        value={end}
        onChange={(e) => onEndChange(Number(e.target.value))}
        className="w-full border rounded-lg p-2 text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            Ends at {formatTime(opt.value)} ({opt.label})
          </option>
        ))}
      </select>
    </div>
  )
}
