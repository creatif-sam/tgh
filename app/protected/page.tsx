'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Goal, Post, Profile } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar'
import {
  Target,
  Calendar,
  MessageCircle,
  ArrowRight,
  PlayCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import DailyActionWord from '@/components/daily-action-word'
import Link from 'next/link'

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [posts, setPosts] =
    useState<(Post & { profiles: Profile })[]>([])
  const [todayPlanner, setTodayPlanner] = useState<{
    reflection?: string
    tasks?: Record<string, unknown>
  } | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    setUserName(auth.user.user_metadata?.full_name ?? null)

    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .or(`owner_id.eq.${auth.user.id},partner_id.eq.${auth.user.id}`)
      .eq('visibility', 'shared')
      .order('created_at', { ascending: false })
      .limit(3)

    const { data: postsData } = await supabase
      .from('posts')
      .select(`*, profiles:author_id (name, avatar_url)`)
      .or(`author_id.eq.${auth.user.id},partner_id.eq.${auth.user.id}`)
      .order('created_at', { ascending: false })
      .limit(2)

    const today = new Date().toISOString().split('T')[0]
    const { data: plannerData } = await supabase
      .from('planner_days')
      .select('*')
      .eq('day', today)
      .single()

    const { data: videoData } = await supabase
      .from('discipline_videos')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    setGoals(goalsData ?? [])
    setPosts(postsData ?? [])
    setTodayPlanner(plannerData ?? null)
    setVideoId(videoData?.youtube_id ?? null)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse max-w-3xl mx-auto">
        <div className="h-6 bg-muted rounded w-1/2" />
        <div className="h-52 bg-muted rounded-xl" />
        <div className="h-36 bg-muted rounded-xl" />
      </div>
    )
  }

  return (
    <div className="p-4 pb-24 space-y-8 max-w-3xl mx-auto">
      {/* Greeting */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome{userName ? ` ${userName}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          Discipline today creates freedom tomorrow
        </p>
      </div>

        {/* Daily Action Word */}
      <DailyActionWord />

      {/* Video Focus */}
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-black">
          {videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Daily Discipline and Action"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No discipline video set yet
            </div>
          )}
        </div>
        <CardContent className="pt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <PlayCircle className="w-4 h-4 text-violet-600" />
            Daily Discipline Focus
          </div>
          <p className="text-sm text-muted-foreground">
            Watch briefly. Reflect deeply. Then act with intention.
          </p>
        </CardContent>
      </Card>

      {/* Why This Works */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
            Why this redesign works
          </h3>

          <div className="space-y-1 text-sm">
            <p>The video sets emotional direction.</p>
            <p>The day plan anchors intention.</p>
            <p>Goals and posts reinforce accountability.</p>
          </div>

          <div className="pt-3 space-y-1 text-sm">
            <p>This is how discipline is built in real life.</p>
            <p>Inspiration.</p>
            <p>Then structure.</p>
            <p>Then community.</p>
          </div>

          <div className="pt-4 text-xs text-muted-foreground">
            Short focused teachings are selected by you to keep
            discipline intentional and personal.
          </div>
        </CardContent>
      </Card>

    

      {/* Today Focus */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-600" />
            Today Focus
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {todayPlanner ? (
            <>
              <p className="text-sm">
                {todayPlanner.reflection ??
                  'No reflection written yet'}
              </p>
              {todayPlanner.tasks && (
                <p className="text-xs text-muted-foreground">
                  {Object.keys(todayPlanner.tasks).length} planned actions
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No plan created for today
            </p>
          )}
        </CardContent>
      </Card>

      {/* Shared Goals */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-600" />
            Shared Goals
          </CardTitle>
          <Link
            href="/protected/goals"
            className="text-xs text-violet-600 flex items-center gap-1"
          >
            View all
            <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.length ? (
            goals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">
                    {goal.title}
                  </p>
                  <Badge
                    variant={
                      goal.status === 'done'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {goal.status.replace('_', ' ')}
                  </Badge>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {goal.progress}% complete
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No shared goals yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Reflections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-violet-600" />
            Recent Reflections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {posts.length ? (
            posts.map((post) => (
              <div key={post.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={post.profiles?.avatar_url ?? undefined}
                    />
                    <AvatarFallback>
                      {post.profiles?.name?.[0] ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {post.profiles?.name ?? 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(post.created_at), 'MMM d')}
                    </p>
                  </div>
                </div>
                <p className="text-sm">{post.content}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No reflections yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
