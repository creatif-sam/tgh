'use client'

import React from 'react'
import { Smile } from 'lucide-react'

export const moodThemes: Record<string, { bg: string; text: string; accent: string; verse: string }> = {
  '😊': { 
    bg: 'bg-yellow-50/50', text: 'text-yellow-800', accent: 'bg-yellow-400',
    verse: "This is the day the Lord has made; let us rejoice and be glad in it. — Psalm 118:24"
  },
  '🤩': { 
    bg: 'bg-orange-50/50', text: 'text-orange-800', accent: 'bg-orange-400',
    verse: "I can do all things through Christ who strengthens me. — Philippians 4:13"
  },
  '😐': { 
    bg: 'bg-slate-50/50', text: 'text-slate-800', accent: 'bg-slate-400',
    verse: "Trust in the Lord with all your heart and lean not on your own understanding. — Proverbs 3:5"
  },
  '😔': { 
    bg: 'bg-blue-50/50', text: 'text-blue-800', accent: 'bg-blue-400',
    verse: "Commit to the Lord whatever you do, and he will establish your plans. — Proverbs 16:3"
  },
  '😴': { 
    bg: 'bg-indigo-50/50', text: 'text-indigo-800', accent: 'bg-indigo-400',
    verse: "In peace I will lie down and sleep, for you alone, Lord, make me dwell in safety. — Psalm 4:8"
  },
  '😡': { 
    bg: 'bg-red-50/50', text: 'text-red-800', accent: 'bg-red-400',
    verse: "Cast all your anxiety on Him because He cares for you. — 1 Peter 5:7"
  },
  'default': { 
    bg: 'bg-white', text: 'text-slate-900', accent: 'bg-blue-600',
    verse: "In his heart a man plans his course, but the Lord determines his steps. — Proverbs 16:9"
  }
}

const moods = [
  { emoji: '😊', label: 'Great' },
  { emoji: '🤩', label: 'Inspired' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'Productive' },
  { emoji: '😴', label: 'Tired' },
  { emoji: '😡', label: 'Stressed' },
]

interface MoodPickerProps {
  currentMood: string
  onMoodSelect: (emoji: string) => void
}

export default function MoodPicker({ currentMood, onMoodSelect }: MoodPickerProps) {
  const [showPicker, setShowPicker] = React.useState(false)
  const theme = moodThemes[currentMood] || moodThemes['default']
  const currentMoodLabel = moods.find(m => m.emoji === currentMood)?.label || ''

  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex flex-col flex-1 pr-4">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1">Daily Verse</span>
        <p className={`text-[13px] font-medium leading-relaxed italic ${theme.text} opacity-80 animate-in fade-in duration-700`}>
          "{theme.verse}"
        </p>
      </div>
      
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative pt-1">
          <button 
            onClick={() => setShowPicker(!showPicker)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-sm ${currentMood ? 'bg-white scale-110' : 'bg-slate-100'}`}
          >
            {currentMood ? <span className="text-2xl">{currentMood}</span> : <Smile className="w-6 h-6 text-slate-400" />}
          </button>

          {showPicker && (
            <div className="absolute right-0 mt-3 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-slate-100 rounded-[28px] p-2 flex gap-2 z-50 animate-in fade-in zoom-in duration-200">
              {moods.map((m) => (
                <button
                  key={m.label}
                  onClick={() => {
                    onMoodSelect(m.emoji)
                    setShowPicker(false)
                  }}
                  className="w-11 h-11 hover:bg-slate-50 rounded-full flex items-center justify-center text-xl active:scale-90 transition-transform"
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        {currentMood && (
          <span className={`text-[10px] font-bold uppercase tracking-widest ${theme.text} opacity-60 animate-in fade-in duration-500`}>
            {currentMoodLabel}
          </span>
        )}
      </div>
    </div>
  )
}