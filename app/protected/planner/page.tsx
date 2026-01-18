import { redirect } from 'next/navigation';

export default function PlannerPage(): never {
  redirect('/protected/planner/day');
}
