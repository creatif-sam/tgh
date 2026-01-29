'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const COLORS = ['#000000', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
const EMOJIS = ['📓', '💡', '🔥', '🧠', '🚀', '🎨', '📅', '🏗️']

export function AddNotebookDialog({ 
  open, 
  onOpenChange, 
  userId, 
  onCreated 
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void, 
  userId: string,
  onCreated: () => Promise<void> 
}) {
  const [title, setTitle] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('📓')
  const [selectedColor, setSelectedColor] = useState('#000000')
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)

    // DEBUG LOGS - Check your browser console
    console.log("--- ATTEMPTING INSERT ---")
    console.log("Current User ID prop:", userId)
    console.log("Payload:", { title, emoji: selectedEmoji, color: selectedColor, user_id: userId })

    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('notebooks')
        .insert({
          title,
          emoji: selectedEmoji,
          color: selectedColor,
          user_id: userId
        })
        .select()

      if (error) {
        // This will explain exactly which column failed
        console.error("SUPABASE ERROR DETAILS:", {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        })
        alert(`Database Error: ${error.message}`)
      } else {
        console.log("Success! Created notebook:", data)
        setTitle('')
        await onCreated()
        onOpenChange(false)
      }
    } catch (err) {
      console.error("Unexpected Logic Error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md rounded-3xl border-2 border-black">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">New Notebook</DialogTitle>
          <DialogDescription className="sr-only">Create a new container for thoughts.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase italic opacity-50">Notebook Name</Label>
            <Input 
              placeholder="e.g., App Ideas" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="border-2 border-black font-bold uppercase italic focus-visible:ring-0"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase italic opacity-50">Identity</Label>
            <div className="grid grid-cols-4 gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setSelectedEmoji(e)}
                  className={`text-2xl p-2 rounded-xl border-2 transition-all ${selectedEmoji === e ? 'border-black bg-muted' : 'border-transparent'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase italic opacity-50">Theme Color</Label>
            <div className="flex justify-between">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === c ? 'border-black scale-125' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleCreate} 
            disabled={loading}
            className="w-full h-14 text-lg font-black uppercase italic border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            {loading ? 'Working...' : 'Initialize Notebook'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}