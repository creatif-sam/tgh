'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReadingList from './ReadingList';
import QuizTabs from '@/components/quiz/QuizTabs';
import CreativeWork from './CreativeWorky';
import { JSX } from 'react';
import { BookOpen, ListChecks, Sparkles } from 'lucide-react';

const triggerClass =
  'flex items-center justify-center gap-2 rounded-xl px-3 py-2 transition-all ' +
  'data-[state=active]:text-violet-600 ' +
  'data-[state=active]:bg-violet-100/60 ' +
  'data-[state=active]:shadow-[0_0_12px_rgba(139,92,246,0.35)]';

const labelClass =
  'text-sm font-medium leading-none';

export default function ReadAppTabs(): JSX.Element {
  return (
    <Tabs defaultValue="read">
      <TabsList className="grid grid-cols-3 gap-1 p-1">
        <TabsTrigger value="read" className={triggerClass}>
          <BookOpen className="w-5 h-5" />
          <span className={labelClass}>Read</span>
        </TabsTrigger>

        <TabsTrigger value="quiz" className={triggerClass}>
          <ListChecks className="w-5 h-5" />
          <span className={labelClass}>Quiz</span>
        </TabsTrigger>

        <TabsTrigger value="creative" className={triggerClass}>
          <Sparkles className="w-5 h-5" />
          <span className={labelClass}>Create</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="read">
        <ReadingList />
      </TabsContent>

      <TabsContent value="quiz">
        <QuizTabs />
      </TabsContent>

      <TabsContent value="creative">
        <CreativeWork />
      </TabsContent>
    </Tabs>
  );
}
