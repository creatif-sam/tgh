import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  url?: string;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class PushNotificationService {
  private async getSupabase() {
    return await createClient();
  }

  private async getServiceSupabase() {
    return createServiceClient();
  }

  /**
   * Send a push notification to a specific user
   */
  async sendToUser(
    userId: string,
    payload: PushNotificationPayload,
    type: 'message' | 'planner_reminder' | 'goal_deadline' | 'goal_progress' | 'post' | 'system' = 'system'
  ) {
    try {
      const supabase = await this.getSupabase();
      // Check user preferences first
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Check if this type of notification is enabled
      const preferenceKey = this.getPreferenceKey(type);
      if (preferences && !preferences[preferenceKey]) {
        return;
      }

      // Get user's push subscriptions
      const { data: subscriptions, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', userId);

      if (error || !subscriptions || subscriptions.length === 0) {
        return;
      }

      // Store notification in database (use service client to bypass RLS)
      const serviceSupabase = await this.getServiceSupabase();
      const { data: notification, error: notificationError } = await serviceSupabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
        })
        .select()
        .single();

      if (notificationError) {
        return;
      }

      // Send push notifications to all user subscriptions
      const results = await Promise.allSettled(
        subscriptions.map(subscription =>
          this.sendWebPush(subscription, payload, notification.id)
        )
      );

      // Update notification as sent if at least one succeeded
      const hasSuccess = results.some(result => result.status === 'fulfilled');
      if (hasSuccess) {
        await supabase
          .from('notifications')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', notification.id);
      }

    } catch (error) {
      // Error handled silently
    }
  }

  /**
   * Send a push notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    payload: PushNotificationPayload,
    type: 'message' | 'planner_reminder' | 'goal_deadline' | 'goal_progress' | 'post' | 'system' = 'system'
  ) {
    await Promise.all(
      userIds.map(userId => this.sendToUser(userId, payload, type))
    );
  }

  /**
   * Send web push notification using Web Push API
   */
  private async sendWebPush(subscription: any, payload: PushNotificationPayload, notificationId: string) {
    const webPush = await import('web-push');

    // Configure VAPID keys (these should be set in environment variables)
    const vapidKeys = {
      subject: 'mailto:admin@tgh-app.com',
      publicKey: process.env.VAPID_PUBLIC_KEY || '',
      privateKey: process.env.VAPID_PRIVATE_KEY || '',
    };

    if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
      throw new Error('VAPID keys not configured');
    }

    webPush.setVapidDetails(
      vapidKeys.subject,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
      image: payload.image,
      data: {
        ...payload.data,
        notificationId,
        url: payload.url,
      },
      actions: payload.actions,
      requireInteraction: payload.requireInteraction,
      silent: payload.silent,
      tag: payload.tag,
    };

    try {
      await webPush.sendNotification(pushSubscription, JSON.stringify(notificationPayload));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Return default preferences if none exist
      return {
        messages: true,
        planner_reminders: true,
        goal_deadlines: true,
        goal_progress: true,
        posts: true,
      };
    }

    return {
      messages: data.messages,
      planner_reminders: data.planner_reminders,
      goal_deadlines: data.goal_deadlines,
      goal_progress: data.goal_progress,
      posts: data.posts,
    };
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<{
    messages: boolean;
    planner_reminders: boolean;
    goal_deadlines: boolean;
    goal_progress: boolean;
    posts: boolean;
  }>) {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
      });

    if (error) {
      throw error;
    }
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    const supabase = await this.getSupabase();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const supabase = await this.getSupabase();
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw error;
    }
  }

  /**
   * Clean up old notifications (keep last 100 per user)
   */
  async cleanupOldNotifications(userId: string) {
    const supabase = await this.getSupabase();
    // This is a simple cleanup - in production you might want more sophisticated logic
    const { data: notifications } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(100, 999); // Keep first 100, delete the rest

    if (notifications && notifications.length > 0) {
      const idsToDelete = notifications.map(n => n.id);
      await supabase
        .from('notifications')
        .delete()
        .in('id', idsToDelete);
    }
  }

  private getPreferenceKey(type: string): keyof {
    messages: boolean;
    planner_reminders: boolean;
    goal_deadlines: boolean;
    goal_progress: boolean;
    posts: boolean;
  } {
    switch (type) {
      case 'message':
        return 'messages';
      case 'planner_reminder':
        return 'planner_reminders';
      case 'goal_deadline':
        return 'goal_deadlines';
      case 'goal_progress':
        return 'goal_progress';
      case 'post':
        return 'posts';
      default:
        return 'messages'; // fallback
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();