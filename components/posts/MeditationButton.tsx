'use client'

import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'
import clsx from 'clsx'

export interface MeditationButtonProps {
  onOpen: () => void
  className?: string
}

export default function MeditationButton({
  onOpen,
  className,
}: MeditationButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onOpen}
      className={clsx(className)}
    >
      <BookOpen className="h-4 w-4 mr-2" />
      <span className="hidden sm:inline">Meditation</span>
    </Button>
  )
}
