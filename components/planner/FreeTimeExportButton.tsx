'use client'

import { useState } from 'react'
import { Modal } from './tasks/Modal'
import type { PlannerTask } from './DailyPlanner'

const HOURS_START = 5
const HOURS_END = 23

interface FreeBlock {
  start: number
  end: number
}

interface Props {
  tasks: PlannerTask[]
  date: Date
}

function parseMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + (m || 0)
}

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function FreeTimeExportButton({
  tasks,
  date,
}: Props) {
  const [freeBlocks, setFreeBlocks] = useState<FreeBlock[] | null>(null)

  function calculateFreeTime() {
    const busy = tasks
      .map((t) => ({
        start: parseMinutes(t.start),
        end: parseMinutes(t.end),
      }))
      .sort((a, b) => a.start - b.start)

    let cursor = HOURS_START * 60
    const end = HOURS_END * 60
    const free: FreeBlock[] = []

    for (const b of busy) {
      if (b.start > cursor) {
        free.push({ start: cursor, end: b.start })
      }
      cursor = Math.max(cursor, b.end)
    }

    if (cursor < end) {
      free.push({ start: cursor, end })
    }

    setFreeBlocks(free)
  }

  const message =
    freeBlocks &&
    `💜 *My Free Time Today* (${date.toDateString()})\n\n` +
      `⏰ Here are the times I am available:\n\n` +
      freeBlocks
        .map(
          (f) =>
            `• ${formatMinutes(f.start)} – ${formatMinutes(f.end)}`
        )
        .join('\n') +
      `\n\n👉 Please pick a time that works best for you.`

  return (
    <>
      <button
        onClick={calculateFreeTime}
        className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white py-2 text-sm font-medium transition"
      >
        💜 Share Free Time
      </button>

      {freeBlocks && message && (
        <Modal onClose={() => setFreeBlocks(null)}>
          <h3 className="font-semibold mb-3">
            Share Your Free Time
          </h3>

          <pre className="text-sm whitespace-pre-wrap border rounded-lg p-3 mb-4">
            {message}
          </pre>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(message)
                setFreeBlocks(null)
              }}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm transition"
            >
              📋 Copy for WhatsApp
            </button>

            <button
              onClick={() => setFreeBlocks(null)}
              className="px-4 py-2 rounded-lg border text-sm"
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
