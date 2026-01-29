'use client'

import { useState } from 'react'
import { ChevronLeft, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'

interface ThoughtEditorProps {
  page: any
  onBack: () => void
  onRefresh: () => Promise<void>
}

export function ThoughtEditor({ page, onBack, onRefresh }: ThoughtEditorProps) {
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content || "")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('pages')
      .update({ 
        title, 
        content,
        updated_at: new Date().toISOString() 
      })
      .eq('id', page.id)

    if (error) {
      console.error("Error saving page:", error)
    } else {
      await onRefresh()
    }
    setIsSaving(false)
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* PWA Toolbar */}
      <header className="flex items-center justify-between p-4 border-b-2 border-black bg-background sticky top-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="font-black uppercase italic text-[10px]">
          <ChevronLeft className="w-4 h-4 mr-1" /> Close
        </Button>
        
        <Button 
          size="sm" 
          onClick={handleSave}
          disabled={isSaving}
          className="font-black uppercase italic text-[10px] bg-green-500 hover:bg-green-600 text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[1px] active:translate-y-[1px]"
        >
          <Save className="w-4 h-4 mr-1" /> {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </header>

      {/* Writing Canvas */}
      <div className="flex-grow overflow-y-auto p-6 space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Thought"
          className="w-full text-3xl font-black uppercase italic tracking-tighter bg-transparent border-none focus:ring-0 placeholder:opacity-20"
        />
        
        <div className="flex items-center gap-2 text-[9px] font-black uppercase text-muted-foreground border-b border-dashed pb-4">
          <span className="bg-black text-white px-2 py-0.5">Edit Mode</span>
          <span>Last Edited: {new Date(page.updated_at).toLocaleTimeString()}</span>
        </div>

        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your thoughts here..."
          className="w-full min-h-[60vh] text-lg font-medium leading-relaxed border-none focus-visible:ring-0 bg-transparent resize-none p-0 outline-none"
        />
      </div>

      <footer className="p-4 bg-muted/10 border-t flex justify-between items-center">
        <p className="text-[9px] font-bold text-muted-foreground uppercase italic">
          Draft automatically saved to hierarchy
        </p>
        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 h-8 w-8">
          <Trash2 className="w-4 h-4" />
        </Button>
      </footer>
    </div>
  )
}