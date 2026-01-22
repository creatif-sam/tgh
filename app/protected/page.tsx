'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Goal, Post, Profile } from '@/lib/types'

import HomeHeader from '@/components/home/HomeHeader'
import ProgressOverview from '@/components/home/ProgressOverview'
import DailyActionWord from '@/components/daily-action-word'
import PostCard from '@/components/posts/PostCard'
import DashboardStats, {
  computeDashboardStats,
} from '@/components/home/DashboardStats'

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

import {
  Target,
  Calendar,
  MessageCircle,
  ArrowRight,
  PlayCircle,
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const supabase = createClient()

  const [userName, setUserName] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const [goals, setGoals] = useState<Goal[]>([])
  const [posts, setPosts] =
    useState<(Post & { profiles: Profile })[]>([])
  const [socialFeedPosts, setSocialFeedPosts] =
    useState<(Post & { profiles: Profile })[]>([])

  const [todayPlanner, setTodayPlanner] = useState<{
    reflection?: string
    tasks?: Record<string, unknown>
  } | null>(null)

  const [videoId, setVideoId] = useState<string | null>(null)

  useEffect(() => {
    loadHomeData()
  }, [])


    useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser()
      if (!auth.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', auth.user.id)
        .single()

      setUserName(profile?.name ?? null)
    }

    loadProfile()
  }, [])

  async function loadHomeData() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    setCurrentUserId(auth.user.id)

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', auth.user.id)
      .single()

    setUserName(profile?.full_name ?? null)

    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .or(
        `owner_id.eq.${auth.user.id},partner_id.eq.${auth.user.id}`
      )

    setGoals(goalsData ?? [])

    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })

    setPosts(postsData ?? [])

    const { data: socialFeed } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .neq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    setSocialFeedPosts(socialFeed ?? [])
  }

  const stats = computeDashboardStats(goals)

  return (
    <div className="p-4 pb-24 space-y-8 max-w-3xl mx-auto">
      <HomeHeader userName={userName} />

      <DailyActionWord />

      <DashboardStats stats={stats} />

      <ProgressOverview
        completedToday={
          goals.filter(
            (g) =>
              g.status === 'done' &&
              g.due_date &&
              new Date(g.due_date).toDateString() ===
                new Date().toDateString()
          ).length
        }
        todayTasks={stats.todayDue}
        completedGoals={
          goals.filter((g) => g.status === 'done').length
        }
        totalGoals={goals.length}
      />

      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-black">
          {videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
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
              No plan created for today & You will waste time if you don't plan it.
            </p>
          )}
        </CardContent>
      </Card>

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-violet-600" />
            Community Feed
          </CardTitle>
          <Link
            href="/protected/posts"
            className="text-xs text-violet-600 flex items-center gap-1"
          >
            View all posts
            <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialFeedPosts.length ? (
            socialFeedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No shared posts yet. Be the first to share something
            </p>
          )}
        </CardContent>
      </Card>

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
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
              />
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
