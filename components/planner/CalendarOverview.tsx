import React from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

interface Props {
  selectedDate: string;
  onSelect: (date: string) => void;
}

export default function CalendarOverview({
  selectedDate,
  onSelect,
}: Props): React.JSX.Element {
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(selectedDate)
  );
  const [daysWithPlans, setDaysWithPlans] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    void loadMonth();
  }, [currentMonth]);

  const loadMonth = async (): Promise<void> => {
    const supabase = createClient();

    const start = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    );
    const end = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    );

    const { data } = await supabase
      .from('planner_days')
      .select('day')
      .gte('day', start.toISOString().split('T')[0])
      .lte('day', end.toISOString().split('T')[0]);

    setDaysWithPlans(
      new Set((data ?? []).map((d) => d.day))
    );
  };

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
              )
            )
          }
        >
          ‹
        </Button>

        <span className="font-medium">
          {currentMonth.toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          })}
        </span>

        <Button
          variant="ghost"
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
              )
            )
          }
        >
          ›
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
          )
            .toISOString()
            .split('T')[0];

          const isSelected = date === selectedDate;
          const hasPlan = daysWithPlans.has(date);

          return (
            <button
              key={date}
              onClick={() => onSelect(date)}
              className={`rounded-lg p-2 text-sm
                ${
                  isSelected
                    ? 'bg-violet-600 text-white'
                    : 'bg-muted'
                }`}
            >
              {day}
              {hasPlan && (
                <div className="w-1 h-1 bg-violet-500 rounded-full mx-auto mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
