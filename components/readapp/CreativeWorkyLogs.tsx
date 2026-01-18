'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, Target, Focus, PenTool } from 'lucide-react';
import { JSX } from 'react';

interface CreativeLog {
  id: string;
  work_date: string;
  hours_worked: number;
  worked_on: string;
  produced: string | null;
  aligned: boolean | null;
  focused: boolean | null;
}

export default function CreativeWorkLogs(): JSX.Element {
  const supabase = createClient();
  const [logs, setLogs] = useState<CreativeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  const load = async (): Promise<void> => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data } = await supabase
      .from('creative_work')
      .select(
        'id, work_date, hours_worked, worked_on, produced, aligned, focused'
      )
      .eq('user_id', auth.user.id)
      .order('work_date', { ascending: false })
      .limit(14);

    setLogs(data ?? []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading logs…
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No creative work logged yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">
        Recent Creative Work
      </h3>

      {logs.map((log) => (
        <div
          key={log.id}
          className="rounded-xl border p-3 space-y-2"
        >
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">
              {new Date(log.work_date).toDateString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {log.hours_worked}h
            </div>
          </div>

          <div className="text-sm flex items-center gap-2">
            <PenTool className="w-4 h-4 text-violet-600" />
            {log.worked_on}
          </div>

          {log.produced && (
            <div className="text-xs text-muted-foreground">
              Produced: {log.produced}
            </div>
          )}

          <div className="flex gap-3 text-xs text-muted-foreground">
            {log.aligned !== null && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {log.aligned ? 'Aligned' : 'Misaligned'}
              </span>
            )}

            {log.focused !== null && (
              <span className="flex items-center gap-1">
                <Focus className="w-3 h-3" />
                {log.focused ? 'Focused' : 'Distracted'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
