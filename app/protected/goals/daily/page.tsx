'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Goal } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  Circle,
  ArrowLeft,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GoalWithCategory extends Goal {
  goal_categories?: {
    id: string
    name: string
    color: string
    emoji: string | null
  } | null
}

export default function DailyExecutionPage() {
  const supabase = createClient()
  const router = useRouter()

  const [goals, setGoals] = useState<GoalWithCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadToday()
  }, [])

  async function loadToday() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setLoading(false)
      return
    }

    const today = new Date().toISOString().split('T')[0]

    const { data } = await supabase
      .from('goals')
      .select('*, goal_categories(*)')
      .or(
        `and(due_date.eq.${today},owner_id.eq.${auth.user.id}),and(status.neq.done,owner_id.eq.${auth.user.id})`
      )
      .order('due_date', { ascending: true })

    setGoals((data as GoalWithCategory[]) ?? [])
    setLoading(false)
  }

  const completedToday = goals.filter(
    (g) => g.status === 'done'
  ).length

  const completionRate =
    goals.length === 0
      ? 0
      : Math.round(
          (completedToday / goals.length) * 100
        )

  async function markDone(goal: GoalWithCategory) {
    const { data } = await supabase
      .from('goals')
      .update({
        status: 'done',
        progress: 100,
      })
      .eq('id', goal.id)
      .select()
      .single()

    if (data) {
      setGoals((g) =>
        g.map((x) =>
          x.id === goal.id
            ? (data as GoalWithCategory)
            : x
        )
      )
    }
  }

  if (loading) {
    return <div className="p-6">Loading today...</div>
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">
            Today
          </h1>
          <p className="text-sm text-muted-foreground">
            Focus on execution. Progress comes from action.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            router.push('/protected/goals')
          }
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Overview
        </Button>
      </div>

      {/* DAILY KPI */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Tasks Today
            </div>
            <div className="text-2xl font-semibold">
              {goals.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Completed
            </div>
            <div className="text-2xl font-semibold">
              {completedToday}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Completion Rate
            </div>
            <div className="text-2xl font-semibold">
              {completionRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* EXECUTION LIST */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            No goals to execute today
          </div>
        ) : (
          goals.map((goal) => {
            const category = goal.goal_categories

            return (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {goal.title}
                      </CardTitle>

                      {category && (
                        <span
                          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${category.color}20`,
                            color: category.color,
                          }}
                        >
                          <span>{category.emoji}</span>
                          <span>{category.name}</span>
                        </span>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant={
                        goal.status === 'done'
                          ? 'secondary'
                          : 'default'
                      }
                      onClick={() => markDone(goal)}
                      disabled={goal.status === 'done'}
                    >
                      {goal.status === 'done' ? (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      ) : (
                        <Circle className="w-4 h-4 mr-2" />
                      )}
                      {goal.status === 'done'
                        ? 'Done'
                        : 'Mark Done'}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-2">
                  <Progress
                    value={goal.progress}
                    className="h-2"
                  />

                  {goal.due_date && (
                    <p className="text-xs text-muted-foreground">
                      Due{' '}
                      {new Date(
                        goal.due_date
                      ).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
