'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Goal, Post, Profile } from '@/lib/types'

import HomeHeader from '@/components/home/HomeHeader'
import ProgressOverview from '@/components/home/ProgressOverview'
import DailyActionWord from '@/components/daily-action-word'
import PostCard from '@/components/posts/PostCard'
import DailyVerseCard from '@/components/meditations/DailyVerse'
import DashboardStats, { computeDashboardStats } from '@/components/home/DashboardStats'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

import {
  Target,
  Calendar,
  MessageCircle,
  ArrowRight,
  Sparkles,
  CloudSun
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const supabase = createClient()

  const [userName, setUserName] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [weather, setWeather] = useState<{ temp: number; desc: string } | null>(null)

  const [goals, setGoals] = useState<Goal[]>([])
  const [posts, setPosts] = useState<(Post & { profiles: Profile })[]>([])
  const [socialFeedPosts, setSocialFeedPosts] = useState<(Post & { profiles: Profile })[]>([])
  const [todayPlanner, setTodayPlanner] = useState<{
    morning?: string
    reflection?: string
    mood?: string
    tasks?: any[]
  } | null>(null)

  useEffect(() => {
    loadHomeData()
  
  }, [])

  
  async function loadHomeData() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    setCurrentUserId(auth.user.id)
    const todayStr = new Date().toISOString().split('T')[0]

    // 1. Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', auth.user.id)
      .single()
    setUserName(profile?.full_name ?? null)

    // 2. Today's Planner Focus
    const { data: plannerData } = await supabase
      .from('planner_days')
      .select('morning, reflection, tasks, mood')
      .eq('user_id', auth.user.id)
      .eq('day', todayStr)
      .maybeSingle()
    setTodayPlanner(plannerData)

    // 3. Goals
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .or(`owner_id.eq.${auth.user.id},partner_id.eq.${auth.user.id}`)
    setGoals(goalsData ?? [])

    // 4. Social Feed - LIMITED TO 2
    const { data: socialFeed } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .neq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(2) 
    setSocialFeedPosts(socialFeed ?? [])
  }

  const stats = computeDashboardStats(goals)

  return (
    <div className="p-4 pb-24 space-y-6 max-w-3xl mx-auto">
      
      {/* 1. Integrated Header & Weather Pill */}
     <HomeHeader userName={userName} weather={weather} />

      {/* 2. Daily Verse Overlay (Now independent from Modal) */}
      <DailyVerseCard />

      {/* 3. Action and Stats */}
      <DailyActionWord />
      <DashboardStats stats={stats} />

      <ProgressOverview
        completedToday={goals.filter(g => g.status === 'done' && g.due_date && new Date(g.due_date).toDateString() === new Date().toDateString()).length}
        todayTasks={stats.todayDue}
        completedGoals={goals.filter(g => g.status === 'done').length}
        totalGoals={goals.length}
      />

      {/* 4. Today Focus */}
      <Card className="overflow-hidden border-none shadow-md bg-white/80 backdrop-blur-sm rounded-[32px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-violet-600" />
              Today's Focus
            </div>
            {todayPlanner?.mood && <span className="text-xl">{todayPlanner.mood}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {todayPlanner ? (
            <>
              {todayPlanner.morning && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={10} className="text-amber-500" /> Intention
                  </p>
                  <p className="text-sm font-semibold text-slate-700 italic border-l-4 border-violet-200 pl-3">
                    "{todayPlanner.morning}"
                  </p>
                </div>
              )}
              {Array.isArray(todayPlanner.tasks) && todayPlanner.tasks.length > 0 ? (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500">{todayPlanner.tasks.length} Actions Planned</p>
                    <div className="flex -space-x-1">
                      {todayPlanner.tasks.slice(0, 5).map((t: any, i: number) => (
                        <div key={i} className={`w-2 h-2 rounded-full border border-white ${t.completed ? 'bg-green-500' : 'bg-slate-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Next: <span className="text-slate-900 font-medium">{todayPlanner.tasks.find((t: any) => !t.completed)?.text || 'Done for today! 🎉'}</span>
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No actions in timeline yet.</p>
              )}
            </>
          ) : (
            <Link href="/protected/planner/day" className="block p-4 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-sm text-slate-500 font-bold hover:bg-slate-100 transition-all">
              ⚠️ No plan for today. Tap to fix this.
            </Link>
          )}
        </CardContent>
      </Card>

      {/* 5. Community Feed - 2 Posts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-violet-600" />
            <h2 className="font-bold text-slate-900 tracking-tight">Community</h2>
          </div>
          <Link href="/protected/posts" className="text-xs font-bold text-violet-600">View all</Link>
        </div>
        <div className="space-y-4">
          {socialFeedPosts.length ? (
            socialFeedPosts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">Checking in on the community...</p>
          )}
        </div>
      </div>

      {/* 6. Shared Goals */}
      <Card className="border-none shadow-sm rounded-[24px]">
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
          {goals.slice(0, 3).map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">{goal.title}</p>
                <Badge variant={goal.status === 'done' ? 'default' : 'secondary'}>{goal.status}</Badge>
              </div>
              <Progress value={goal.progress} className="h-1.5" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}