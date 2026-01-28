'use client'

import { useMemo } from 'react'
import { Goal } from '@/lib/types'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Target, CheckCircle2, Clock, MoreVertical, Archive, RotateCcw, Plus, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { NewGoalForm, GoalCategory } from '@/components/goals/NewGoalForm'
import { Vision } from '@/app/protected/goals/page'
import { cn } from '@/lib/utils'

export function VisionListView({ 
  goals, 
  visions, 
  categories, 
  onRefresh 
}: { 
  goals: Goal[], 
  visions: Vision[], 
  categories: GoalCategory[], 
  onRefresh: () => void 
}) {
  const supabase = createClient()

  const visionStats = useMemo(() => {
    return visions.map(vision => {
      const visionGoals = goals.filter(g => g.vision_id === vision.id)
      const totalGoals = visionGoals.length
      const avgProgress = totalGoals > 0 
        ? Math.round(visionGoals.reduce((acc, curr) => acc + (curr.progress || 0), 0) / totalGoals)
        : 0
      const completedGoals = visionGoals.filter(g => g.status === 'done').length
      return { ...vision, totalGoals, completedGoals, avgProgress }
    })
  }, [goals, visions])

  async function toggleArchive(id: string, currentStatus: boolean) {
    await supabase.from('visions').update({ is_archived: !currentStatus }).eq('id', id)
    onRefresh()
  }

  return (
    // Grid: 1 column on mobile, 2 on tablet, 3 on desktop
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-2 md:px-0">
      {visionStats.map((v) => (
        <Card 
          key={v.id} 
          className={cn(
            "relative overflow-hidden border-t-4 shadow-sm transition-all duration-300",
            v.is_archived ? "opacity-60 grayscale-[0.5] bg-secondary/10" : "opacity-100"
          )} 
          style={{ borderTopColor: v.is_archived ? '#94a3b8' : v.color }}
        >
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-center mb-1">
              <div className="text-3xl">{v.emoji}</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 -mr-2">
                    <MoreVertical className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="font-bold uppercase text-[10px]">
                  <DropdownMenuItem onClick={() => toggleArchive(v.id, v.is_archived)}>
                    {v.is_archived ? <><RotateCcw className="w-3 h-3 mr-2" /> Restore</> : <><Archive className="w-3 h-3 mr-2" /> Archive</>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="text-lg md:text-xl font-black uppercase tracking-tighter italic leading-none">
              {v.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 pt-2 space-y-4">
            {v.description && (
              <div className="relative p-3 bg-muted/40 rounded-lg border-l-2 border-primary/20 italic text-[11px] leading-relaxed text-muted-foreground">
                <ScrollText className="w-3 h-3 absolute -top-1 -right-1 text-primary/40" />
                "{v.description}"
              </div>
            )}

            {/* Progress Section */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                <span>Realization</span>
                <span style={{ color: v.color }}>{v.avgProgress}%</span>
              </div>
              <Progress value={v.avgProgress} className="h-2 bg-secondary" style={{ '--progress-foreground': v.color } as any} />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 border-y border-dashed py-3 border-muted">
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Target className="w-3 h-3" /> Scope</p>
                <p className="font-black text-xs uppercase italic">{v.totalGoals} Goals</p>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Hits</p>
                <p className="font-black text-xs uppercase italic">{v.completedGoals} Done</p>
              </div>
            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground uppercase italic bg-secondary/50 px-2 py-1 rounded">
                <Clock className="w-3 h-3" />
                <span>{v.target_date ? new Date(v.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2d' }) : 'No End'}</span>
              </div>
              
              {!v.is_archived && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary" className="h-9 px-4 text-[10px] font-black uppercase italic bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-sm active:scale-95 transition-transform">
                      <Plus className="w-3 h-3 mr-1 stroke-[3px]" /> Add Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-black uppercase italic tracking-tighter text-left">New Goal: {v.title}</DialogTitle>
                    </DialogHeader>
                    <NewGoalForm 
                      categories={categories} 
                      visions={visions}
                      initialVisionId={v.id} 
                      onCancel={() => {}} 
                      onCreated={() => onRefresh()} 
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}