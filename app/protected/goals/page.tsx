'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Goal } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Target, Users } from 'lucide-react';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [newGoalVisibility, setNewGoalVisibility] = useState<'private' | 'shared'>('private');
  const [selectedType, setSelectedType] = useState<'single' | 'combined'>('single');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('goals')
      .select('*')
      .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    setGoals(data || []);
    setLoading(false);
  };

  const createGoal = async () => {
    if (!newGoalTitle.trim()) return;
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      const goalData = {
        title: newGoalTitle.trim(),
        description: newGoalDescription.trim(),
        visibility: newGoalVisibility,
        goal_type: selectedType,
        owner_id: user.id,
      };

      const { data, error } = await supabase.from('goals').insert(goalData).select();
      if (error) {
        console.error('Error creating goal:', error);
        return;
      }

      if (data) {
        setGoals([data[0], ...goals]);
      }
      setShowNewGoal(false);
      setNewGoalTitle('');
      setNewGoalDescription('');
    } catch (error) {
      console.error('Error creating goal:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Goals</h1>
        <Button size="sm" onClick={() => setShowNewGoal(!showNewGoal)}>
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {showNewGoal && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <Input
              placeholder="Goal title"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
            />
            <Textarea
              placeholder="Goal description (optional)"
              value={newGoalDescription}
              onChange={(e) => setNewGoalDescription(e.target.value)}
              className="min-h-[80px]"
            />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex gap-2">
                <Select value={selectedType} onValueChange={(value) => setSelectedType(value as 'single' | 'combined')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Personal</SelectItem>
                    <SelectItem value="combined">Shared</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newGoalVisibility} onValueChange={(value) => setNewGoalVisibility(value as 'private' | 'shared')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="shared">Shared</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-x-2 mt-2 sm:mt-0">
                <Button variant="outline" onClick={() => setShowNewGoal(false)}>
                  Cancel
                </Button>
                <Button onClick={createGoal} disabled={!newGoalTitle.trim()}>
                  Create Goal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="my" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            My Goals
          </TabsTrigger>
          <TabsTrigger value="our" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Our Goals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="space-y-4">
          {goals.filter((goal) => goal.goal_type === 'single').length ? (
            goals.filter((goal) => goal.goal_type === 'single').map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No personal goals yet</p>
                <Button className="mt-4" size="sm" onClick={() => setShowNewGoal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="our" className="space-y-4">
          {goals.filter((goal) => goal.goal_type === 'combined').length ? (
            goals.filter((goal) => goal.goal_type === 'combined').map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No shared goals yet</p>
                <Button className="mt-4" size="sm" onClick={() => setShowNewGoal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Our First Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const [status, setStatus] = useState<Goal['status']>(goal.status);
  const [progress, setProgress] = useState(goal.progress);
  const [completedAt, setCompletedAt] = useState<string | undefined>(goal.completed_at);

  const statusProgress: Record<Goal['status'], number> = {
    to_do: 0,
    doing: 49,
    blocked: 75,
    done: 100,
  };

  const updateStatus = async (newStatus: Goal['status']) => {
    const supabase = createClient();
    let completed_at: string | undefined = completedAt;
    if (newStatus === 'done') {
      completed_at = new Date().toISOString();
      setCompletedAt(completed_at);
    } else {
      completed_at = undefined;
      setCompletedAt(undefined);
    }
    setStatus(newStatus);
    setProgress(statusProgress[newStatus]);
    await supabase
      .from('goals')
      .update({ status: newStatus, progress: statusProgress[newStatus], completed_at })
      .eq('id', goal.id);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{goal.title}</CardTitle>
          <Badge variant={goal.visibility === 'shared' ? 'default' : 'secondary'}>
            {goal.visibility}
          </Badge>
        </div>
        {goal.description && (
          <p className="text-sm text-muted-foreground">{goal.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between items-center gap-2">
          <Select value={status} onValueChange={(val) => updateStatus(val as Goal['status'])}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="to_do">To-Do (0%)</SelectItem>
              <SelectItem value="doing">Doing (49%)</SelectItem>
              <SelectItem value="blocked">Blocked (75%)</SelectItem>
              <SelectItem value="done">Done (100%)</SelectItem>
            </SelectContent>
          </Select>
          {status === 'done' && completedAt && (
            <span className="text-xs text-green-600 font-semibold ml-2">Completed on {new Date(completedAt).toLocaleDateString()}</span>
          )}
          {goal.due_date && (
            <span className="text-xs text-muted-foreground ml-2">
              Due {new Date(goal.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}