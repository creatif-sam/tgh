'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']
const EMOJIS = ['🔭', '🚀', '🧠', '💪', '🎨', '🌍', '📈', '🧘']

export function VisionCreator({ onCreated }: { onCreated: () => void }) {
  const supabase = createClient()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newVision, setNewVision] = useState({ 
    title: '', 
    description: '', 
    color: COLORS[0], 
    emoji: EMOJIS[0],
    target_date: ''
  })

  async function handleCreateVision() {
    if (!newVision.title) return
    setIsCreating(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('visions').insert({
      title: newVision.title,
      description: newVision.description,
      color: newVision.color,
      emoji: newVision.emoji,
      target_date: newVision.target_date,
      owner_id: user?.id
    })

    if (!error) {
      setIsOpen(false)
      setNewVision({ title: '', description: '', color: COLORS[0], emoji: EMOJIS[0], target_date: '' })
      onCreated()
    }
    setIsCreating(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full gap-2 border-primary/20 hover:bg-primary/5 active:scale-95 transition-transform">
          <Sparkles className="w-4 h-4 text-primary" /> 
          <span className="text-sm font-semibold">Cast New Vision</span>
        </Button>
      </DialogTrigger>
      
      {/* Mobile optimization: 
        - w-[95vw] keeps it from hitting screen edges 
        - max-h-[90vh] ensures it doesn't get lost under the notch/home bar 
        - overflow-y-auto handles small screens + keyboard
      */}
      <DialogContent className="w-[95vw] max-w-[425px] rounded-2xl overflow-y-auto max-h-[90vh] p-6 gap-0">
        <DialogHeader className="text-left pb-4">
          <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">
            Define the North Star
          </DialogTitle>
          <DialogDescription className="text-xs">
            What high-level outcome are you chasing?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          {/* Vision Title */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Vision Title</label>
            <Input 
              placeholder="e.g. Total Financial Freedom" 
              value={newVision.title}
              onChange={(e) => setNewVision({...newVision, title: e.target.value})}
              // text-base (16px) prevents iOS zoom on focus
              className="text-base border-0 bg-secondary/50 focus-visible:ring-primary font-bold h-12"
            />
          </div>

          {/* Color Picker - Increased Touch Target */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Identity Color</label>
            <div className="flex flex-wrap gap-3 justify-between">
              {COLORS.map(c => (
                <button 
                  key={c} 
                  type="button"
                  onClick={() => setNewVision({...newVision, color: c})}
                  className={cn(
                    "w-9 h-9 rounded-full transition-all flex-shrink-0", 
                    newVision.color === c ? "scale-110 ring-4 ring-primary/20 border-2 border-white" : "opacity-60"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Target Date</label>
            <Input 
              type="date"
              value={newVision.target_date}
              onChange={(e) => setNewVision({...newVision, target_date: e.target.value})}
              className="text-base border-0 bg-secondary/50 focus-visible:ring-primary font-bold h-12"
            />
          </div>

          {/* Emoji Picker - Grid for better thumb reach */}
          <div className="space-y-3">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Icon</label>
            <div className="grid grid-cols-4 gap-3">
              {EMOJIS.map(e => (
                <button 
                  key={e} 
                  type="button"
                  onClick={() => setNewVision({...newVision, emoji: e})}
                  className={cn(
                    "h-12 rounded-xl bg-secondary flex items-center justify-center text-xl transition-all", 
                    newVision.emoji === e ? "bg-primary text-white shadow-md" : "active:bg-secondary/80 opacity-60"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleCreateVision} 
            className="w-full font-bold uppercase tracking-widest h-14 mt-4" 
            disabled={isCreating || !newVision.title}
          >
            {isCreating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cast Vision'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}