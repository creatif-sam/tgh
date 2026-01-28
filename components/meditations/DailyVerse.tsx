'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Copy, Check } from 'lucide-react'

export default function DailyVerseCard() {
  const [verse, setVerse] = useState({ text: "...", ref: "..." })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchVerse() {
      try {
        const res = await fetch('https://beta.ourmanna.com/api/v1/get/?format=json&order=daily')
        const data = await res.json()
        if (data?.verse?.details) {
          setVerse({ 
            text: data.verse.details.text, 
            ref: data.verse.details.reference 
          })
        }
      } catch (e) {
        setVerse({ 
          text: "Commit your work to the Lord, and your plans will be established.", 
          ref: "Proverbs 16:3" 
        })
      }
    }
    fetchVerse()
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${verse.text} - ${verse.ref}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group border border-white/20">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-xl backdrop-blur-md">
              <Sparkles size={14} className="text-violet-100" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-100">Daily Bread</span>
          </div>
          <button 
            onClick={copyToClipboard}
            className="bg-white/10 p-2 rounded-xl hover:bg-white/20 transition-all active:scale-90"
          >
            {copied ? <Check size={14} className="text-green-300" /> : <Copy size={14} />}
          </button>
        </div>
        <p className="text-lg font-semibold italic leading-relaxed tracking-tight">
          "{verse.text.trim()}"
        </p>
        <div className="flex items-center gap-2 mt-4">
          <span className="w-6 h-[2px] bg-white/30 rounded-full" />
          <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{verse.ref}</p>
        </div>
      </div>
      {/* Abstract Background Shapes */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -left-10 -top-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl" />
    </div>
  )
}