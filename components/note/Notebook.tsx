'use client'

import { useState } from 'react'
import { Plus, Folder, ChevronRight, MoreVertical, Loader2, Book, FileText, ChevronLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ThoughtEditor } from './ThoughtEditor'
import { AddNotebookDialog } from './AddNotebookDialog'

type Page = { id: string; title: string; content: any; updated_at: string }
type Section = { id: string; title: string; pages: Page[] }
type Notebook = { id: string; title: string; emoji: string; color: string; sections: Section[] }

interface ThoughtBookProps {
  notebooks: Notebook[]
  onRefresh: () => Promise<void>
  userId: string
}

export function ThoughtBook({ notebooks, onRefresh, userId }: ThoughtBookProps) {
  const [activeNotebook, setActiveNotebook] = useState<Notebook | null>(null)
  const [activeSection, setActiveSection] = useState<Section | null>(null)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [showAddNotebook, setShowAddNotebook] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  async function handleAddLevel() {
    if (isCreating) return
    setIsCreating(true)
    const supabase = createClient()

    if (activeSection) {
      const { data, error } = await supabase
        .from('pages')
        .insert({
          section_id: activeSection.id,
          title: 'Untitled Page',
          content: ''
        })
        .select()
        .single()

      if (!error && data) {
        await onRefresh()
        setEditingPage(data)
      }
    } else if (activeNotebook) {
      const { error } = await supabase
        .from('sections')
        .insert({
          notebook_id: activeNotebook.id,
          title: 'New Section'
        })

      if (!error) await onRefresh()
    }
    setIsCreating(false)
  }

  if (editingPage) {
    return (
      <ThoughtEditor 
        page={editingPage} 
        onBack={() => setEditingPage(null)} 
        onRefresh={onRefresh} 
      />
    )
  }

  if (!activeNotebook) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Notebook Library</h2>
            <p className="text-xs text-muted-foreground">Select a notebook to begin</p>
          </div>
          <Button 
            onClick={() => setShowAddNotebook(true)}
            size="sm"
            className="rounded-full gap-2 px-4 shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Notebook
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          {notebooks.map((nb) => (
            <Card
              key={nb.id}
              onClick={() => setActiveNotebook(nb)}
              className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group border-muted"
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/20"
                  style={{ backgroundColor: nb.color + '20' }}
                >
                  {nb.emoji}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-semibold text-sm truncate">{nb.title}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    {nb.sections?.length || 0} Sections
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>

        <AddNotebookDialog 
          open={showAddNotebook} 
          onOpenChange={setShowAddNotebook} 
          userId={userId} 
          onCreated={onRefresh} 
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right-4 duration-300">
      <header className="py-4 border-b flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => activeSection ? setActiveSection(null) : setActiveNotebook(null)}
            className="h-8 w-8 rounded-md"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{activeNotebook.emoji}</span>
            <h2 className="text-lg font-bold tracking-tight truncate max-w-[200px]">
              {activeSection ? activeSection.title : activeNotebook.title}
            </h2>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleAddLevel}
          disabled={isCreating}
          className="h-8 text-xs font-medium rounded-md gap-2"
        >
          {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
          Add {activeSection ? 'Page' : 'Section'}
        </Button>
      </header>

      <div className="flex-grow overflow-y-auto py-4 space-y-1">
        {!activeSection ? (
          activeNotebook.sections?.map((s) => (
            <button 
              key={s.id} 
              onClick={() => setActiveSection(s)} 
              className="w-full flex items-center justify-between p-3 px-4 rounded-lg hover:bg-muted/50 transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <Folder className="w-4 h-4 text-primary/70" />
                <span className="text-sm font-medium">{s.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono">{s.pages?.length || 0}</span>
                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))
        ) : (
          activeSection.pages?.map((p) => (
            <div
              key={p.id}
              onClick={() => setEditingPage(p)}
              className="flex items-center justify-between p-3 px-4 rounded-lg bg-card border border-transparent hover:border-border hover:shadow-sm transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{p.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    Last sync: {new Date(p.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
        
        {((!activeSection && activeNotebook.sections?.length === 0) || (activeSection && activeSection.pages?.length === 0)) && (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 opacity-40">
            <Book className="w-8 h-8" />
            <p className="text-sm font-medium italic">This space is currently blank</p>
          </div>
        )}
      </div>
    </div>
  )
}