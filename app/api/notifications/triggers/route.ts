import { NextRequest, NextResponse } from 'next/server';
import { notificationTriggers } from '@/lib/notification-triggers';

// This endpoint can be called by cron jobs or scheduled tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type } = body;

    switch (type) {
      case 'goal_deadlines':
        await notificationTriggers.checkGoalDeadlines();
        break;
      case 'planner_reminders':
        await notificationTriggers.checkPlannerReminders();
        break;
      case 'all':
        await notificationTriggers.checkGoalDeadlines();
        await notificationTriggers.checkPlannerReminders();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid trigger type. Use: goal_deadlines, planner_reminders, or all' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, message: `${type} notifications triggered` });
  } catch (error) {
    console.error('Error triggering notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}