'use client'

import { useEffect, useRef } from 'react'

interface TimedSoundProps {
  src: string
  durationMs?: number
  onStop?: () => void
}

export default function TimedSound({
  src,
  durationMs = 5000,
  onStop,
}: TimedSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const audio = new Audio(src)
    audio.volume = 0.4
    audioRef.current = audio

    audio.play().catch(() => {})

    timeoutRef.current = setTimeout(stop, durationMs)

    return stop
  }, [])

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    onStop?.()
  }

  return (
    <button
      onClick={stop}
      className="w-full rounded-xl bg-violet-600 text-white py-2 text-sm font-medium"
    >
      Stop sound 🔇
    </button>
  )
}
