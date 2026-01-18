'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Goal, Post, Profile } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Target,
  Calendar,
  MessageCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import DailyActionWord from '@/components/daily-action-word';
import Link from 'next/link';

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [posts, setPosts] = useState<(Post & { profiles: Profile })[]>([]);
  const [todayPlanner, setTodayPlanner] = useState<{
    reflection?: string;
    tasks?: Record<string, unknown>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    void fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserName(user.user_metadata?.full_name ?? null);

    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq('visibility', 'shared')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: postsData } = await supabase
      .from('posts')
      .select(
        `
        *,
        profiles:author_id (name, avatar_url)
      `
      )
      .or(`author_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(3);

    const today = new Date().toISOString().split('T')[0];
    const { data: plannerData } = await supabase
      .from('planner_days')
      .select('*')
      .eq('day', today)
      .single();

    setGoals(goalsData ?? []);
    setPosts(postsData ?? []);
    setTodayPlanner(plannerData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-6 bg-muted rounded w-1/2" />
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-40 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Greeting */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hello{userName ? ` ${userName}` : ''} ✨
        </h1>
        <p className="text-sm text-muted-foreground">
          Let us move with purpose today
        </p>
      </div>

      {/* Daily Word */}
      <DailyActionWord />

      {/* Shared Goals */}
      <Card className="transition hover:shadow-md">
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
              <div
                key={goal.id}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium text-sm">
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

                <Progress
                  value={goal.progress}
                  className="h-2"
                />

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

      {/* Today Focus */}
      <Card className="transition hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-600" />
            Today
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          {todayPlanner ? (
            <>
              <p className="text-sm">
                {todayPlanner.reflection ??
                  'No reflection yet'}
              </p>
              {todayPlanner.tasks && (
                <p className="text-xs text-muted-foreground">
                  {Object.keys(todayPlanner.tasks)
                    .length}{' '}
                  planned actions
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No plans for today
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card className="transition hover:shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-violet-600" />
            Recent Posts
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {posts.length ? (
            posts.map((post) => (
              <div
                key={post.id}
                className="space-y-2"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={
                        (post.profiles as Profile)
                          ?.avatar_url ?? undefined
                      }
                    />
                    <AvatarFallback>
                      {(post.profiles as Profile)
                        ?.name?.[0] ?? 'U'}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="text-sm font-medium">
                      {(post.profiles as Profile)
                        ?.name ?? 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(
                        new Date(post.created_at),
                        'MMM d'
                      )}
                    </p>
                  </div>
                </div>

                <p className="text-sm">
                  {post.content}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No posts yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
