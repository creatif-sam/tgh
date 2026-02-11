'use client'

import React, { useState } from 'react'
import DailyPlanner from '@/components/planner/DailyPlanner'
import { Button } from '@/components/ui/button'
import { Clock, Wallet } from 'lucide-react'
import DailyMoneyPlanner from '@/components/planner/money_planner/page'

type PlanningMode = 'time' | 'money'

export default function DayPlannerPage(): React.JSX.Element {
  const [mode, setMode] = useState<PlanningMode>('time')

  return (
    <div className="flex flex-col gap-6 px-4 pb-24 max-w-xl mx-auto min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Header Section */}
      <div className="text-xl font-black tracking-tight text-center pt-4">
        Daily Planning
        <div className="h-1 w-8 bg-violet-600 mx-auto mt-1 rounded-full" />
      </div>

      {/* Mode Switcher / Tabs */}
      <div className="flex gap-1 rounded-2xl bg-muted/50 p-1.5 backdrop-blur-sm border border-border/50">
        <TabButton
          active={mode === 'time'}
          onClick={() => setMode('time')}
          label="Time"
          icon={<Clock size={16} />}
        />
        <TabButton
          active={mode === 'money'}
          onClick={() => setMode('money')}
          label="Money"
          icon={<Wallet size={16} />}
        />
      </div>

      {/* Content Area */}
      <div className="rounded-[28px] border border-border/40 bg-card dark:bg-zinc-900/40 backdrop-blur-sm p-4 shadow-sm transition-all">
        <div className="w-full">
          {mode === 'time' && <DailyPlanner />}

          {mode === 'money' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <DailyMoneyPlanner />
            </div>
          )}
        </div>
      </div>
      
      {/* Visual Cue for PWA Navigation */}
      <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest opacity-50">
        Switch modes to organize your day
      </p>
    </div>
  )
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className={`flex-1 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 py-6 ${
        active
          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20 dark:shadow-none'
          : 'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className={`${active ? 'animate-bounce-short' : ''}`}>{icon}</span>
      <span>{label}</span>
    </Button>
  )
}