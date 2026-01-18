'use client';

import { Textarea } from '@/components/ui/textarea';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function EveningReflection({
  value,
  onChange,
}: Props): JSX.Element {
  return (
    <div className="mt-6">
      <p className="text-sm font-medium mb-2">
        Evening Reflection
      </p>
      <Textarea
        value={value}
        placeholder="What good have I done today?"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
