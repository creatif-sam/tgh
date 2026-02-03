'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Bold, Italic, ListOrdered, BookOpen, X, Loader2 } from 'lucide-react'

// Tiptap Imports
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'

export default function MeditationComposer({ meditation, onClose, onCreated }: any) {
  const [title, setTitle] = useState('')
  const [scripture, setScripture] = useState('')
  const [application, setApplication] = useState('')
  const [prayer, setPrayer] = useState('')
  const [visibility, setVisibility] = useState<'private' | 'shared'>('private')
  const [autoPost, setAutoPost] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#7c3aed] underline font-bold cursor-pointer',
        },
      }),
      Placeholder.configure({ 
        placeholder: 'What is the Holy Spirit revealing to you?' 
      }),
    ],
    content: meditation?.lesson || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none min-h-[140px] p-4 bg-white/50',
      },
    },
  })

  useEffect(() => {
    if (meditation && editor) {
      setTitle(meditation.title)
      setScripture(meditation.scripture)
      setApplication(meditation.application)
      setPrayer(meditation.prayer)
      setVisibility(meditation.visibility)
      editor.commands.setContent(meditation.lesson)
    }
  }, [meditation, editor])

  const setBibleLink = () => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('Enter Bible Reference:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    const finalUrl = url.includes('http') 
      ? url 
      : `https://www.biblegateway.com/passage/?search=${encodeURIComponent(url)}&version=NIV`
    editor?.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run()
  }

  async function saveMeditation() {
    const lessonContent = editor?.getHTML() || ''
    if (!title || !scripture || !lessonContent) {
      toast.error("Title, Scripture, and Revelation are required.")
      return
    }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return setSaving(false)
    const period = new Date().getHours() < 12 ? 'morning' : 'evening'

    try {
      const payload = { author_id: user.id, title, scripture, lesson: lessonContent, application, prayer, visibility, period }
      const { data, error } = meditation?.id 
        ? await supabase.from('meditations').update(payload).eq('id', meditation.id).select().single()
        : await supabase.from('meditations').insert(payload).select().single()
      if (error) throw error
      if (autoPost && data) {
        let partnerId = null
        if (visibility === 'shared') {
          const { data: p } = await supabase.from('profiles').select('partner_id').eq('id', user.id).single()
          partnerId = p?.partner_id
        }
        await supabase.from('posts').insert({
          author_id: user.id, partner_id: partnerId, visibility, meditation_id: data.id,
          content: `🧘 Just finished a ${period} meditation: "${title}"`,
        })
      }
      toast.success("Journal synced to Heaven! 🤍")
      onCreated?.()
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally { setSaving(false) }
  }

  if (!editor) return null

  return (
    <div className="fixed inset-0 z-[100] md:flex md:items-center md:justify-center p-0 md:p-4 bg-black/20 backdrop-blur-sm">
      <Card className="w-full h-full md:h-auto md:max-w-2xl border-none shadow-2xl md:rounded-[40px] rounded-none bg-white/95 flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
        <CardContent className="p-0 flex flex-col h-full">
          
          {/* Header - Fixed on Mobile */}
          <div className="bg-[#7c3aed] p-5 md:p-6 text-white flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none">Daily Bread</h2>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-70 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 pb-32">
            <Input 
              placeholder="Focus of the Revelation..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-2xl border-slate-100 bg-slate-50/50 h-12 text-md font-bold px-4 focus:ring-violet-200"
            />

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">The Word (Scripture)</label>
              <Textarea 
                placeholder="e.g., Matthew 6:33" 
                value={scripture} 
                onChange={(e) => setScripture(e.target.value)}
                className="rounded-2xl border-slate-100 bg-slate-50/50 min-h-[60px] px-4 py-3 italic text-sm"
              />
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Revelation & Lesson</label>
               <div className="border-2 border-violet-50 rounded-[24px] overflow-hidden shadow-inner bg-white">
                  {/* Sticky Toolbar for Mobile */}
                  <div className="flex items-center gap-1 p-2 border-b border-violet-50 bg-violet-50/20 sticky top-0 z-10 backdrop-blur-sm">
                    <RichButton icon={<Bold size={16}/>} onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} />
                    <RichButton icon={<Italic size={16}/>} onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} />
                    <RichButton icon={<ListOrdered size={16}/>} onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} />
                    <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                    <RichButton icon={<BookOpen size={16}/>} onClick={setBibleLink} active={editor.isActive('link')} />
                  </div>
                  <EditorContent editor={editor} />
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Life Application</label>
                <Textarea placeholder="How will you walk this out?" value={application} onChange={(e) => setApplication(e.target.value)} className="rounded-2xl border-slate-100 bg-slate-50/50 min-h-[80px]" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Prayer</label>
                <Textarea placeholder="Seal it in prayer..." value={prayer} onChange={(e) => setPrayer(e.target.value)} className="rounded-2xl border-slate-100 bg-slate-50/50 min-h-[80px]" />
              </div>
            </div>
          </div>

          {/* Footer - Fixed on Mobile Bottom */}
          <div className="fixed bottom-0 left-0 right-0 md:relative bg-white/80 backdrop-blur-md p-5 md:p-6 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
            <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
              <SelectTrigger className="w-[120px] rounded-xl border-slate-200 font-bold text-xs h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="private">🔒 Private</SelectItem>
                <SelectItem value="shared">❤️ Shared</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={saveMeditation} 
              disabled={saving}
              className="flex-1 md:flex-none rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] px-6 h-12 font-black text-md shadow-xl shadow-violet-200 transition-all active:scale-95"
            >
              {saving ? <Loader2 className="animate-spin h-5 w-5"/> : 'Sync Journal'}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

function RichButton({ icon, onClick, active }: any) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`p-2 rounded-xl transition-all ${active ? 'bg-white text-[#7c3aed] shadow-sm' : 'text-slate-400'}`}
    >
      {icon}
    </button>
  )
}