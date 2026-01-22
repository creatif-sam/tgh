'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Goal } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Plus,
  Calendar,
  Target,
  Download,
  Users,
} from 'lucide-react'
import { NewGoalForm } from '@/components/goals/NewGoalForm'
import { GoalList } from '@/components/goals/GoalList'
import { GoalsOverview } from '@/components/goals/GoalsOverview'

type GoalView = 'weekly' | 'quarterly' | 'yearly'

interface GoalCategory {
  id: string
  name: string
  color: string
  emoji: string | null
}

interface UiGoalCategory {
  id: string
  name: string
  color: string
  emoji?: string
}

export default function GoalsPage() {
  const supabase = createClient()

  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] =
    useState<GoalCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [view, setView] = useState<GoalView>('weekly')
  const [showSharedOnly, setShowSharedOnly] =
    useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) {
      setLoading(false)
      return
    }

    const [{ data: goalsData }, { data: categoryData }] =
      await Promise.all([
        supabase
          .from('goals')
          .select('*, goal_categories(*)')
          .or(
            `owner_id.eq.${auth.user.id},partner_id.eq.${auth.user.id}`
          )
          .order('created_at', { ascending: false }),

        supabase
          .from('goal_categories')
          .select('*')
          .eq('user_id', auth.user.id),
      ])

    setGoals(goalsData ?? [])
    setCategories(categoryData ?? [])
    setLoading(false)
  }

  function onCreated(goal: Goal) {
    setGoals((g) => [goal, ...g])
    setShowNew(false)
  }

  function onUpdated(goal: Goal) {
    setGoals((g) =>
      g.map((x) => (x.id === goal.id ? goal : x))
    )
  }

  function onDeleted(id: string) {
    setGoals((g) => g.filter((x) => x.id !== id))
  }

  function exportGoals(list: Goal[], title: string) {
    const text =
      `${title}\n\n` +
      list
        .map(
          (g) =>
            `• ${g.title} | ${g.status} | ${g.due_date}`
        )
        .join('\n')

    navigator.clipboard.writeText(text)
    alert('Exported to clipboard')
  }

  const now = new Date()

  const baseGoals = showSharedOnly
    ? goals.filter((g) => g.goal_type === 'combined')
    : goals

  const filteredGoals = useMemo(() => {
    if (view === 'weekly') {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      const end = new Date(start)
      end.setDate(start.getDate() + 7)

      return baseGoals.filter((g) => {
        if (!g.due_date) return false
        const d = new Date(g.due_date)
        return d >= start && d < end
      })
    }

    if (view === 'quarterly') {
      return baseGoals.filter((g) => {
        if (!g.due_date) return false
        const d = new Date(g.due_date)
        return (
          Math.floor(d.getMonth() / 3) ===
            Math.floor(now.getMonth() / 3) &&
          d.getFullYear() === now.getFullYear()
        )
      })
    }

    return baseGoals.filter(
      (g) =>
        g.due_date &&
        new Date(g.due_date).getFullYear() ===
          now.getFullYear()
    )
  }, [baseGoals, view])

  /* ✅ NORMALIZATION FIX */
  const uiCategories: UiGoalCategory[] = useMemo(
    () =>
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        emoji: c.emoji ?? undefined,
      })),
    [categories]
  )

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {loading ? (
        <div className="p-4">Loading...</div>
      ) : (
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="overview">
              <Calendar className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="goals">
              <Target className="w-4 h-4 mr-2" />
              Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <GoalsOverview
              goals={filteredGoals}
              categories={uiCategories}
            />
          </TabsContent>

          <TabsContent value="goals">
            <Tabs
              value={view}
              onValueChange={(v) =>
                setView(v as GoalView)
              }
            >
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="weekly">
                  Weekly
                </TabsTrigger>
                <TabsTrigger value="quarterly">
                  Quarterly
                </TabsTrigger>
                <TabsTrigger value="yearly">
                  Yearly
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <div className="flex justify-between mb-2">
                  <div className="text-sm font-semibold capitalize">
                    {view} goals
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        showSharedOnly
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        setShowSharedOnly(!showSharedOnly)
                      }
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Shared
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportGoals(
                          filteredGoals,
                          `${view.toUpperCase()} GOALS`
                        )
                      }
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowNew(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New
                    </Button>
                  </div>
                </div>

                {showNew && (
                  <NewGoalForm
                    categories={uiCategories}
                    onCancel={() => setShowNew(false)}
                    onCreated={onCreated}
                  />
                )}

                <GoalList
                  goals={filteredGoals}
                  onUpdated={onUpdated}
                  onDeleted={onDeleted}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
