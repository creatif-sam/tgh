'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Video = {
  id: string
  youtube_id: string
  youtube_url: string
  is_active: boolean
  user_id: string
}

export default function DisciplineVideosForm() {
  const supabase = createClient()
  const [videos, setVideos] = useState<Video[]>([])
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    const { data } = await supabase
      .from('discipline_videos')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })

    setVideos(data ?? [])
  }

  function extractYouTubeId(link: string) {
    const match = link.match(
      /(?:youtube\.com.*v=|youtu\.be\/)([^&]+)/,
    )
    return match?.[1] ?? null
  }

  async function addVideo() {
    if (videos.length >= 4) {
      alert('You can add a maximum of 4 videos')
      return
    }

    const id = extractYouTubeId(url)
    if (!id) {
      alert('Please paste a valid YouTube link')
      return
    }

    setLoading(true)

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    await supabase.from('discipline_videos').insert({
      user_id: auth.user.id,
      youtube_url: url,
      youtube_id: id,
      is_active: videos.length === 0,
    })

    setUrl('')
    setLoading(false)
    loadVideos()
  }

  async function setActive(videoId: string) {
    if (videos.length === 0) return

    await supabase
      .from('discipline_videos')
      .update({ is_active: false })
      .eq('user_id', videos[0].user_id)

    await supabase
      .from('discipline_videos')
      .update({ is_active: true })
      .eq('id', videoId)

    loadVideos()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discipline Videos</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Paste YouTube link</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button onClick={addVideo} disabled={loading}>
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum of 4 videos. One must be active.
          </p>
        </div>

        <div className="space-y-2">
          {videos.map((v) => (
            <div
              key={v.id}
              className="flex justify-between items-center border rounded-lg p-2 text-sm"
            >
              <span className="truncate">{v.youtube_id}</span>
              <Button
                size="sm"
                variant={v.is_active ? 'default' : 'outline'}
                onClick={() => setActive(v.id)}
              >
                {v.is_active ? 'Active' : 'Set Active'}
              </Button>
            </div>
          ))}

          {videos.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No discipline videos added yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
