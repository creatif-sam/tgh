'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CloudSun, X } from 'lucide-react'

interface WeatherData {
  temp: number
  forecast?: { date: string; tempMax: number; tempMin: number }[]
}

interface HomeHeaderProps {
  userName?: string | null
  weather ?: { temp: number; desc: string } | null
}

export default function HomeHeader({ userName }: HomeHeaderProps) {
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [showForecast, setShowForecast] = useState(false)

  useEffect(() => {
    const fetchFullWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
        )
        const data = await res.json()
        
        // Map the next 3 days of forecast
        const forecast = data.daily.time.slice(1, 4).map((time: string, i: number) => ({
          date: new Date(time).toLocaleDateString(undefined, { weekday: 'short' }),
          tempMax: Math.round(data.daily.temperature_2m_max[i + 1]),
          tempMin: Math.round(data.daily.temperature_2m_min[i + 1]),
        }))

        setWeather({
          temp: Math.round(data.current_weather.temperature),
          forecast
        })
      } catch (err) {
        console.error("Weather fetch failed", err)
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        fetchFullWeather(pos.coords.latitude, pos.coords.longitude)
      })
    }
    
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const { year, daysGone, desktopDays, mobileDays, countdown } = useMemo(() => {
    const start = new Date(now.getFullYear(), 0, 1)
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
    const daysGone = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const remainingMs = Math.max(end.getTime() - now.getTime(), 0)

    const countdownObj = {
      days: Math.floor(remainingMs / (1000 * 60 * 60 * 24)),
      hours: Math.floor((remainingMs / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((remainingMs / (1000 * 60)) % 60),
    }

    const generateDays = (count: number, offset: number) => 
      Array.from({ length: count }).map((_, i) => {
        const d = new Date(now); d.setDate(now.getDate() - offset + i); return d
      })

    return { 
      year: now.getFullYear(), daysGone, countdown: countdownObj,
      desktopDays: generateDays(7, 3), mobileDays: generateDays(4, 1) 
    }
  }, [now])

  const isToday = (d: Date) => d.toDateString() === now.toDateString()

  return (
    <div className="space-y-4 w-full relative">
      {/* Top Greeting and Clickable Weather Pill */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Today</h1>
          <p className="text-sm text-slate-500 font-medium italic">
            Stay intentional{userName ? `, ${userName}` : ''}
          </p>
        </div>

        {weather && (
          <div className="relative">
            <button 
              onClick={() => setShowForecast(!showForecast)}
              className="flex items-center gap-3 bg-violet-600 text-white pl-2 pr-5 py-2 rounded-2xl shadow-lg shadow-violet-200 transition-transform active:scale-95 z-30 relative"
            >
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <CloudSun size={20} className="text-white" />
              </div>
              <div className="flex flex-col text-right leading-none">
                <span className="text-lg font-black">{weather.temp}°C</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                   {showForecast ? 'Close' : 'Live'}
                </span>
              </div>
            </button>

            {/* 3-Day Forecast Overlay */}
            {showForecast && weather.forecast && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 duration-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">3-Day Forecast</div>
                <div className="space-y-3">
                  {weather.forecast.map((f, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-600">{f.date}</span>
                      <div className="flex gap-2">
                        <span className="font-bold text-slate-900">{f.tempMax}°</span>
                        <span className="text-slate-400">{f.tempMin}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar Strip */}
      <div className="flex items-center justify-between gap-2">
        <button className="p-2 rounded-xl border border-slate-100 bg-white shadow-sm text-slate-400"><ChevronLeft size={16} /></button>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 sm:hidden">
            {mobileDays.map(day => (
              <div key={day.toDateString()} className={`min-w-[56px] rounded-2xl px-3 py-2 text-center text-sm transition-all ${isToday(day) ? 'bg-violet-600 text-white shadow-md' : 'bg-white border border-slate-100 text-slate-400'}`}>
                <div className="text-[10px] uppercase font-bold opacity-70">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                <div className="font-bold text-base">{day.getDate()}</div>
              </div>
            ))}
          </div>
          <div className="hidden sm:flex gap-2">
            {desktopDays.map(day => (
              <div key={day.toDateString()} className={`min-w-[60px] rounded-2xl px-3 py-2 text-center text-sm transition-all ${isToday(day) ? 'bg-violet-600 text-white shadow-md' : 'bg-white border border-slate-100 text-slate-400'}`}>
                <div className="text-[10px] uppercase font-bold opacity-70">{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                <div className="font-bold text-base">{day.getDate()}</div>
              </div>
            ))}
          </div>
        </div>
        <button className="p-2 rounded-xl border border-slate-100 bg-white shadow-sm text-slate-400"><ChevronRight size={16} /></button>
      </div>

      {/* Progress Card */}
      <div className="rounded-[28px] p-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-xl shadow-violet-100 relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">{year} Progress</div>
            <div className="text-4xl font-black leading-none">{daysGone}</div>
            <div className="text-[10px] font-bold opacity-70 mt-1">days gone</div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-black tracking-tighter">{countdown.days}</span>
            <div className="flex flex-col">
              <span className="text-sm font-bold uppercase">days</span>
              <span className="text-[10px] opacity-70 font-medium">{countdown.hours}h {countdown.minutes}m left</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}