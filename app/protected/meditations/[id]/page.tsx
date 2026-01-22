'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import MeditationComposer from '@/components/meditations/MeditationComposer'
import {
  ArrowLeft,
  Pencil,
  Share2,
  Image,
  BookOpen,
  Lightbulb,
  CheckCircle,
  Heart,
} from 'lucide-react'

interface Meditation {
  id: string
  title: string
  scripture: string
  lesson: string
  application: string
  prayer: string
  visibility: 'private' | 'shared'
  created_at: string
}

export default function MeditationViewPage() {
  const { id } = useParams()
  const router = useRouter()
  const pageRef = useRef<HTMLDivElement>(null)

  const [meditation, setMeditation] = useState<Meditation | null>(null)
  const [editing, setEditing] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    loadMeditation()
  }, [id])

  async function loadMeditation() {
    const supabase = createClient()
    const { data } = await supabase
      .from('meditations')
      .select('*')
      .eq('id', id)
      .single()

    setMeditation(data)
  }

  async function shareToFeed() {
    if (!meditation) return
    setSharing(true)

    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    await supabase.from('posts').insert({
      author_id: auth.user.id,
      visibility: meditation.visibility,
      meditation_id: meditation.id,
      content: `Meditation: ${meditation.title}`,
    })

    setSharing(false)
  }

  function shareAsImage() {
    window.print()
  }

  if (!meditation) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center text-sm text-muted-foreground">
        Loading meditation
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/protected/meditations')}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>

          <Button size="sm" variant="ghost" onClick={shareToFeed}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>

          <Button size="sm" variant="ghost" onClick={shareAsImage}>
            <Image className="h-4 w-4 mr-1" />
            Image
          </Button>
        </div>
      </header>

      {/* Book page */}
      <main
        ref={pageRef}
        className="max-w-3xl mx-auto bg-white px-12 py-16 shadow-sm"
      >
        <article className="space-y-12 font-serif text-[17px] leading-relaxed text-stone-800">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-violet-700">
              {meditation.title}
            </h1>
            <p className="text-sm text-stone-500">
              {new Date(meditation.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Scripture */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-violet-100 px-3 py-1 rounded-sm">
              <BookOpen className="h-4 w-4 text-violet-700" />
              <h2 className="text-xs uppercase tracking-widest text-violet-800">
                Scripture
              </h2>
            </div>
            <p className="italic whitespace-pre-line pl-1">
              {meditation.scripture}
            </p>
          </section>

          {/* Lesson */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-violet-100 px-3 py-1 rounded-sm">
              <Lightbulb className="h-4 w-4 text-violet-700" />
              <h2 className="text-xs uppercase tracking-widest text-violet-800">
                Lesson
              </h2>
            </div>
            <p className="whitespace-pre-line pl-1">
              {meditation.lesson}
            </p>
          </section>

          {/* Application */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-violet-100 px-3 py-1 rounded-sm">
              <CheckCircle className="h-4 w-4 text-violet-700" />
              <h2 className="text-xs uppercase tracking-widest text-violet-800">
                Application
              </h2>
            </div>
            <p className="whitespace-pre-line pl-1">
              {meditation.application}
            </p>
          </section>

          {/* Prayer */}
          <section className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-violet-100 px-3 py-1 rounded-sm">
              <Heart className="h-4 w-4 text-violet-700" />
              <h2 className="text-xs uppercase tracking-widest text-violet-800">
                Prayer
              </h2>
            </div>
            <p className="italic whitespace-pre-line pl-1">
              {meditation.prayer}
            </p>
          </section>
        </article>
      </main>

      {editing && (
        <MeditationComposer
          meditation={meditation}
          onClose={() => setEditing(false)}
          onCreated={() => {
            setEditing(false)
            loadMeditation()
          }}
        />
      )}
    </div>
  )
}
