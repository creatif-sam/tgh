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

    console.log('🧪 Test notification for user:', user.id);

    // Check if user has push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    console.log('📡 Found subscriptions:', subscriptions?.length || 0, 'Error:', subError);
    console.log('📋 Subscription details:', subscriptions);
    console.log('👤 Current user ID:', user.id);

    if (subError) {
      console.error('❌ Subscription query error:', subError);
      // Try without RLS to debug
      const { data: allSubs, error: allError } = await supabase
        .from('push_subscriptions')
        .select('*');
      console.log('🔓 All subscriptions in DB (no RLS):', allSubs?.length || 0, 'Error:', allError);
    }

    // Send a test notification to the current user
    await pushNotificationService.sendToUser(user.id, {
      title: 'Test Notification',
      body: 'This is a test push notification from TGH!',
      data: { type: 'system', test: true },
      url: '/protected',
    }, 'system');

    return NextResponse.json({
      success: true,
      message: 'Test notification sent!',
      subscriptionsFound: subscriptions?.length || 0
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}