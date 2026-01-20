'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Post, Profile } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Heart,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react'
import { format } from 'date-fns'
import PostCard from '@/components/posts/PostCard'

type PostWithProfile = Post & { profiles: Profile }

export default function PostsPage() {
  const [posts, setPosts] = useState<PostWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostVisibility, setNewPostVisibility] =
    useState<'private' | 'shared'>('shared')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    setUserId(auth.user.id)

    // Debug: Check all posts to see visibility
    const { data: allPosts } = await supabase
      .from('posts')
      .select(`*, profiles:author_id (name, avatar_url)`)
      .order('created_at', { ascending: false })
      .limit(10)

    console.log('All posts:', allPosts)

    // Fetch all shared posts from all users
    const { data } = await supabase
      .from('posts')
      .select(`*, profiles:author_id (name, avatar_url)`)
      .eq('visibility', 'shared')
      .order('created_at', { ascending: false })

    console.log('Shared posts:', data)
    setPosts(data ?? [])
    setLoading(false)
  }

  async function createPost() {
    if (!newPostContent.trim()) return
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    const { data } = await supabase
      .from('posts')
      .insert({
        content: newPostContent,
        visibility: newPostVisibility,
        author_id: auth.user.id,
      })
      .select(`*, profiles:author_id (name, avatar_url)`)
      .single()

    if (data) {
      setPosts([data, ...posts])
      setNewPostContent('')
      setShowNewPost(false)
    }
  }

  async function updatePost(id: string, content: string) {
    const supabase = createClient()

    await supabase
      .from('posts')
      .update({ content })
      .eq('id', id)

    setPosts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, content } : p,
      ),
    )
  }

  async function deletePost(id: string) {
    const supabase = createClient()

    await supabase.from('posts').delete().eq('id', id)

    setPosts((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Posts</h1>
        <Button onClick={() => setShowNewPost(!showNewPost)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {showNewPost && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <Textarea
              placeholder="What is on your mind?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <Select
                value={newPostVisibility}
                onValueChange={(v) =>
                  setNewPostVisibility(v as 'private' | 'shared')
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="shared">Shared</SelectItem>
                </SelectContent>
              </Select>

              <div className="space-x-2">
                <Button variant="outline" onClick={() => setShowNewPost(false)}>
                  Cancel
                </Button>
                <Button onClick={createPost}>Post</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={userId || ''}
            onUpdate={updatePost}
            onDelete={deletePost}
          />
        ))}
      </div>
    </div>
  )
}
