'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { JSX } from 'react';

interface Attempt {
  id: string;
  verdict: string;
  wrong_count: number;
  created_at: string;
}

export default function QuizHistory(): JSX.Element {
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  useEffect(() => {
    void load();
  }, []);

  const load = async (): Promise<void> => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { data } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false });

    setAttempts(data ?? []);
  };

  return (
    <div className="p-4 space-y-3">
      {attempts.map((a) => (
        <div key={a.id} className="border rounded-xl p-3">
          <p className="font-medium">{a.verdict}</p>
          <p className="text-sm text-muted-foreground">
            Wrong answers: {a.wrong_count}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(a.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
