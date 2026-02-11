'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import FeedSwitch from '@/components/feed/FeedSwitch'
import MeditationComposer from '@/components/meditations/MeditationComposer'
import { Pencil, Copy, LayoutGrid, List, Search, Filter } from 'lucide-react'
import MeditationStreakBoard from '@/components/meditations/MeditationStreakBoard'
import PartnerMeditationBoard from '@/components/meditations/PartnerMeditationBoard'

import type { MeditationDB } from '@/lib/types'

type ViewMode = 'list' | 'grid'

export default function MeditationsPage() {
  const [meditations, setMeditations] = useState<MeditationDB[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [accountCreatedAt, setAccountCreatedAt] = useState<string | null>(null)

  const [editing, setEditing] = useState<MeditationDB | null>(null)
  const [search, setSearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'private' | 'shared'>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  useEffect(() => {
    loadMeditations()
  }, [])

  async function loadMeditations() {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    setUserId(auth.user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', auth.user.id)
      .single()

    if (profile?.created_at) setAccountCreatedAt(profile.created_at)

    const { data, error } = await supabase
      .from('meditations')
      .select('id, author_id, title, scripture, lesson, application, prayer, visibility, period, created_at')
      .order('created_at', { ascending: false })

    if (!error) setMeditations(data as MeditationDB[])
  }

  const filteredMeditations = useMemo(() => {
    return meditations.filter((m) => {
      const matchesSearch =
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.scripture.toLowerCase().includes(search.toLowerCase())
      const matchesVisibility = visibilityFilter === 'all' || m.visibility === visibilityFilter
      return matchesSearch && matchesVisibility
    })
  }, [meditations, search, visibilityFilter])

  function copyMeditation(m: MeditationDB) {
    const text = `${m.title}\n\n${m.scripture}\n\n${m.lesson}\n${m.application}\n${m.prayer}`.trim()
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 bg-background text-foreground min-h-screen transition-colors duration-300">
      
      {/* Header Section */}
      <header className="space-y-6">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter">Meditations</h1>
            <p className="text-sm text-muted-foreground italic">
              Personal reflections and scripture insights
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? <LayoutGrid className="h-5 w-5" /> : <List className="h-5 w-5" />}
            </Button>
            <Button
              size="sm"
              className="rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20"
              onClick={() => setEditing({} as MeditationDB)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Write
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search title or scripture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-muted/50 border-none focus-visible:ring-violet-500"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border-none rounded-xl appearance-none focus:ring-2 focus:ring-violet-500 outline-none"
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value as any)}
            >
              <option value="all">All Access</option>
              <option value="private">Private Only</option>
              <option value="shared">Shared Feed</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-center sm:justify-start">
          <FeedSwitch />
        </div>
      </header>

      {/* Boards Section */}
      <div className="grid gap-6">
        {userId && accountCreatedAt && (
          <div className="rounded-[24px] border border-border/40 bg-card/50 dark:bg-zinc-900/40 backdrop-blur-sm p-1">
            <MeditationStreakBoard
              meditations={meditations}
              ownerId={userId}
              accountCreatedAt={accountCreatedAt}
            />
          </div>
        )}
        <PartnerMeditationBoard />
      </div>

      {/* Composer Modal */}
      {editing && (
        <MeditationComposer
          meditation={editing.id ? editing : undefined}
          onClose={() => setEditing(null)}
          onCreated={() => {
            setEditing(null)
            loadMeditations()
          }}
        />
      )}

      {/* View Logic */}
      <section className="space-y-4">
        {viewMode === 'list' ? (
          <div className="divide-y divide-border/40 border border-border/40 rounded-[24px] overflow-hidden bg-card/30">
            {filteredMeditations.map((m) => (
              <div key={m.id} className="group hover:bg-muted/40 transition-colors px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <Link href={`/protected/meditations/${m.id}`} className="space-y-1 flex-1">
                    <h2 className="font-bold text-foreground group-hover:text-violet-500 transition-colors">
                      {m.title}
                    </h2>
                    <p className="text-sm text-muted-foreground italic line-clamp-1">
                      {m.scripture}
                    </p>
                  </Link>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyMeditation(m)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  <span className={`px-2 py-0.5 rounded-full ${m.visibility === 'shared' ? 'bg-violet-500/10 text-violet-500' : 'bg-muted text-muted-foreground'}`}>
                    {m.visibility}
                  </span>
                  <span>{new Date(m.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredMeditations.map((m) => (
              <div key={m.id} className="rounded-[24px] border border-border/40 bg-card/50 dark:bg-zinc-900/40 hover:border-violet-500/50 transition-all p-5 flex flex-col justify-between group">
                <Link href={`/protected/meditations/${m.id}`} className="space-y-3">
                  <h2 className="text-base font-black leading-tight group-hover:text-violet-500 transition-colors">
                    {m.title}
                  </h2>
                  <p className="text-xs text-muted-foreground italic line-clamp-2">
                    {m.scripture}
                  </p>
                </Link>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/20">
                  <span className="text-[10px] font-bold text-muted-foreground/50">
                    {new Date(m.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditing(m)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyMeditation(m)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredMeditations.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed border-border/40 rounded-[32px]">
            <p className="text-sm text-muted-foreground italic font-medium">
              No matching meditations found
            </p>
          </div>
        )}
      </section>
    </div>
  )
}