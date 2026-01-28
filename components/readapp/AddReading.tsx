'use client'

import { JSX, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ReadingCategory =
  | 'faith'
  | 'self_development'
  | 'skill'
  | 'philosophy'
  | 'psychology'
  | 'leadership'
  | 'productivity'
  | 'miscellaneous'

interface Props {
  onCreated: () => void
}

export default function AddReading({ onCreated }: Props): JSX.Element {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [source, setSource] = useState('')
  const [totalPages, setTotalPages] = useState('')
  const [visibility, setVisibility] =
    useState<'private' | 'shared'>('private')
  const [category, setCategory] =
    useState<ReadingCategory>('self_development')
  const [loading, setLoading] = useState(false)

  const createReading = async (): Promise<void> => {
    if (!title.trim()) return

    const pages = Number(totalPages)
    if (!pages || pages <= 0) return

    setLoading(true)
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (!user || authError) {
      setLoading(false)
      return
    }

    const { error } = await supabase.from('readings').insert({
      user_id: user.id,
      title: title.trim(),
      author: author.trim() || null,
      source: source.trim() || null,
      category,
      visibility,
      status: 'to_read',
      total_pages: pages,
      pages_remaining: pages,
    })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    setTitle('')
    setAuthor('')
    setSource('')
    setTotalPages('')
    setVisibility('private')
    setCategory('self_development')
    setLoading(false)
    onCreated()
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <Input
        placeholder="Book or article title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <Input
        placeholder="Author optional"
        value={author}
        onChange={e => setAuthor(e.target.value)}
      />

      <Input
        placeholder="Source book article Bible etc"
        value={source}
        onChange={e => setSource(e.target.value)}
      />

      <Input
        type="number"
        min="1"
        placeholder="Total pages"
        value={totalPages}
        onChange={e => setTotalPages(e.target.value)}
      />

      <Select
        value={category}
        onValueChange={v =>
          setCategory(v as ReadingCategory)
        }
      >
        <SelectTrigger>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="faith">Faith</SelectItem>
          <SelectItem value="self_development">Self development</SelectItem>
          <SelectItem value="skill">Skill</SelectItem>
          <SelectItem value="philosophy">Philosophy</SelectItem>
          <SelectItem value="psychology">Psychology</SelectItem>
          <SelectItem value="leadership">Leadership</SelectItem>
          <SelectItem value="productivity">Productivity</SelectItem>
          <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={visibility}
        onValueChange={v =>
          setVisibility(v as 'private' | 'shared')
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="private">Private</SelectItem>
          <SelectItem value="shared">Shared</SelectItem>
        </SelectContent>
      </Select>

      <Button
        size="sm"
        disabled={loading || !title.trim() || !totalPages}
        onClick={createReading}
      >
        Add Reading
      </Button>
    </div>
  )
}
