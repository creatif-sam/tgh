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
  Sparkles
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const supabase = createClient()

  const [userName, setUserName] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  const [goals, setGoals] = useState<Goal[]>([])
  const [posts, setPosts] = useState<(Post & { profiles: Profile })[]>([])
  const [socialFeedPosts, setSocialFeedPosts] = useState<(Post & { profiles: Profile })[]>([])

  // State for the Planner Data
  const [todayPlanner, setTodayPlanner] = useState<{
    morning?: string
    reflection?: string
    mood?: string
    tasks?: any[]
  } | null>(null)

  const [videoId, setVideoId] = useState<string | null>(null)

  useEffect(() => {
    loadHomeData()
  }, [])

  async function loadHomeData() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    setCurrentUserId(auth.user.id)
    const todayStr = new Date().toISOString().split('T')[0]

    // 1. Load Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', auth.user.id)
      .single()
    setUserName(profile?.full_name ?? null)

    // 2. Load Planner Data for Today
    const { data: plannerData } = await supabase
      .from('planner_days')
      .select('morning, reflection, tasks, mood')
      .eq('user_id', auth.user.id)
      .eq('day', todayStr)
      .maybeSingle()
    
    setTodayPlanner(plannerData)

    // 3. Load Goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .or(`owner_id.eq.${auth.user.id},partner_id.eq.${auth.user.id}`)
    setGoals(goalsData ?? [])

    // 4. Load User Posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    setPosts(postsData ?? [])

    // 5. Load Social Feed
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
              new Date(g.due_date).toDateString() === new Date().toDateString()
          ).length
        }
        todayTasks={stats.todayDue}
        completedGoals={goals.filter((g) => g.status === 'done').length}
        totalGoals={goals.length}
      />

      {/* Video Section */}
      <Card className="overflow-hidden border-none shadow-sm">
        <div className="relative aspect-video bg-black">
          {videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1`}
              title="Daily Discipline"
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

      {/* Today Focus Section - FIXED & CONNECTED */}
      <Card className="overflow-hidden border-none shadow-sm bg-white/50 backdrop-blur-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600" />
              Today's Focus
            </div>
            {todayPlanner?.mood && (
              <span className="text-lg" title="Today's Mood">{todayPlanner.mood}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todayPlanner ? (
            <>
              {todayPlanner.morning && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Sparkles size={10} className="text-amber-500" />
                    Intention
                  </div>
                  <p className="text-sm font-medium text-slate-700 italic">
                    "{todayPlanner.morning}"
                  </p>
                </div>
              )}

              {Array.isArray(todayPlanner.tasks) && todayPlanner.tasks.length > 0 ? (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500">
                      {todayPlanner.tasks.length} {todayPlanner.tasks.length === 1 ? 'Action' : 'Actions'} Planned
                    </p>
                    <div className="flex -space-x-1">
                      {todayPlanner.tasks.slice(0, 5).map((t: any, i: number) => (
                        <div 
                          key={i} 
                          className={`w-2 h-2 rounded-full border border-white ${t.completed ? 'bg-green-500' : 'bg-slate-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate">
                    Next: <span className="text-slate-900 font-medium">
                      {todayPlanner.tasks.find((t: any) => !t.completed)?.text || 'All caught up!'}
                    </span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No tasks added to the timeline yet.</p>
              )}
            </>
          ) : (
            <div className="py-2">
              <p className="text-sm text-slate-500 leading-relaxed">
                No plan created for today. 
                <Link href="/protected/planner/day" className="block mt-1 text-[11px] font-bold text-amber-600 hover:underline uppercase tracking-tight">
                  ⚠️ You will waste time if you don't plan it.
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared Goals Section */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-violet-600" />
            Shared Goals
          </CardTitle>
          <Link href="/protected/goals" className="text-xs text-violet-600 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.length ? (
            goals.map((goal) => (
              <div key={goal.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium">{goal.title}</p>
                  <Badge variant={goal.status === 'done' ? 'default' : 'secondary'}>
                    {goal.status.replace('_', ' ')}
                  </Badge>
                </div>
                <Progress value={goal.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">{goal.progress}% complete</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No shared goals yet</p>
          )}
        </CardContent>
      </Card>

      {/* Community Feed Section */}
      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-violet-600" />
            Community Feed
          </CardTitle>
          <Link href="/protected/posts" className="text-xs text-violet-600 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialFeedPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}