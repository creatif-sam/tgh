'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Goal } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const CATEGORY_EMOJIS = [
  '🎯',
  '📚',
  '💪',
  '🙏',
  '💼',
  '❤️',
  '🧠',
  '🏡',
  '💰',
  '⏰',
]

const CATEGORY_COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#4f46e5',
  '#15803d',
  '#b45309',
  '#7c3aed',
]

export interface GoalCategory {
  id: string
  name: string
  color: string
  emoji?: string
}

export interface Vision {
  id: string
  title: string
}

export function NewGoalForm({
  onCancel,
  onCreated,
  categories,
  visions,
}: {
  onCancel: () => void
  onCreated: (goal: Goal) => void
  categories: GoalCategory[]
  visions: Vision[]
}) {

  const supabase = createClient()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deliverable, setDeliverable] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [visionId, setVisionId] = useState<string>('none') 

  const [goalType, setGoalType] =
    useState<'single' | 'combined'>('single')
  const [visibility, setVisibility] =
    useState<'private' | 'shared'>('private')

  const [showCategoryInput, setShowCategoryInput] =
    useState(false)
  const [newCategoryName, setNewCategoryName] =
    useState('')
  const [selectedEmoji, setSelectedEmoji] =
    useState(CATEGORY_EMOJIS[0])

  const [localCategories, setLocalCategories] =
    useState<GoalCategory[]>(categories)

  const valid =
    Boolean(title.trim()) &&
    Boolean(dueDate) &&
    Boolean(categoryId)





  async function createCategory() {
    if (!newCategoryName.trim()) return

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    const color =
      CATEGORY_COLORS[
        localCategories.length %
          CATEGORY_COLORS.length
      ]

    const { data, error } = await supabase
      .from('goal_categories')
      .insert({
        name: newCategoryName.trim(),
        emoji: selectedEmoji,
        color,
        user_id: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      return
    }

    setLocalCategories((c) => [...c, data])
    setCategoryId(data.id)
    setNewCategoryName('')
    setSelectedEmoji(CATEGORY_EMOJIS[0])
    setShowCategoryInput(false)
  }

  async function createGoal() {
    if (!valid) return

    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return

    let partnerId = null

    if (visibility === 'shared') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', auth.user.id)
        .single()

      partnerId = profile?.partner_id ?? null
    }

    const { data, error } = await supabase
      .from('goals')
      .insert({
        title: title.trim(),
        description: description.trim(),
        deliverable: deliverable.trim() || null,
        due_date: dueDate,
        category_id: categoryId,
        vision_id: visionId === 'none' ? null : visionId,
        goal_type: goalType,
        visibility,
        owner_id: auth.user.id,
        partner_id: partnerId,
      })
      .select()
      .single()

    if (error) {
      console.error(error)
      return
    }

    setTitle('')
    setDescription('')
    setDeliverable('')
    setDueDate('')
    setCategoryId('')

    onCreated(data)
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Input
          placeholder="Goal title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          placeholder="Description"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
        />

        <Select value={visionId} onValueChange={setVisionId}>
  <SelectTrigger>
    <SelectValue placeholder="Linked Vision " />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">No Vision (Standalone)</SelectItem>
    {visions.map((v) => (
      <SelectItem key={v.id} value={v.id}>
        ✨ {v.title}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

        <Input
          placeholder="Deliverable or indicator"
          value={deliverable}
          onChange={(e) =>
            setDeliverable(e.target.value)
          }
        />

        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        <Select
          value={categoryId}
          onValueChange={setCategoryId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {localCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {(c.emoji ?? '📁')} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!showCategoryInput ? (
       <Button
  type="button"
  size="sm"
  variant="outline"
  className="text-violet-600 border-violet-300 hover:bg-violet-50 hover:text-violet-700"
  onClick={() => setShowCategoryInput(true)}
>
  Add new category
</Button>

        ) : (
          <div className="space-y-2">
            <Input
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) =>
                setNewCategoryName(e.target.value)
              }
            />

            <div className="flex gap-2 flex-wrap">
              {CATEGORY_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setSelectedEmoji(e)}
                  className={`p-2 border rounded ${
                    selectedEmoji === e
                      ? 'border-black'
                      : 'border-muted'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>

            <Button size="sm" onClick={createCategory}>
              Create category
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Select
            value={goalType}
            onValueChange={(v) =>
              setGoalType(
                v as 'single' | 'combined'
              )
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">
                Personal
              </SelectItem>
              <SelectItem value="combined">
                Shared
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={visibility}
            onValueChange={(v) =>
              setVisibility(
                v as 'private' | 'shared'
              )
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">
                Private
              </SelectItem>
              <SelectItem value="shared">
                Shared
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={!valid} onClick={createGoal}>
            Create Goal
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
