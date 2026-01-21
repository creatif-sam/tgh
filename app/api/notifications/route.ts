import { NextRequest, NextResponse } from 'next/server';
import { pushNotificationService } from '@/lib/push-notifications';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, type, title, body: notificationBody, data, url } = body;

    if (!userId || !type || !title || !notificationBody) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, title, body' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ['message', 'planner_reminder', 'goal_deadline', 'goal_progress', 'post', 'system'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    await pushNotificationService.sendToUser(userId, {
      title,
      body: notificationBody,
      data,
      url,
    }, type as any);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const notifications = await pushNotificationService.getUserNotifications(user.id, limit, offset);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}