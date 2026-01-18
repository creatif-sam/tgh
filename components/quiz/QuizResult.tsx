'use client';

import { Button } from '@/components/ui/button';
import { JSX } from 'react';

export default function QuizResult({
  wrong,
  onExit,
}: {
  wrong: number;
  onExit: () => void;
}): JSX.Element {
  const verdict = wrong >= 2 ? 'Culprit' : 'Passed';

  return (
    <div className="p-6 space-y-4 text-center">
      <h2 className="text-xl font-semibold">{verdict}</h2>
      <p className="text-muted-foreground">
        Wrong answers: {wrong}
      </p>
      <p className="text-sm">
        Examine yourself whether you be in the faith
      </p>
      <Button onClick={onExit}>Return</Button>
    </div>
  );
}
