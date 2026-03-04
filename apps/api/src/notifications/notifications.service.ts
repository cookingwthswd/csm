import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Notification, NotificationSettings } from '@repo/types';
import { SupabaseService } from '../common';

@Injectable()
export class NotificationsService {
  constructor(private readonly supabase: SupabaseService) {}

  private handleError(error: PostgrestError, context: string): never {
    // eslint-disable-next-line no-console
    console.error('[NotificationsService]', context, error);
    throw new InternalServerErrorException(`Database error: ${context}`);
  }

  private mapNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as Notification['type'],
      title: row.title,
      message: row.message,
      data: (row.data ?? null) as Record<string, unknown> | null,
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  }
  
  private mapSettings(row: any): NotificationSettings {
    return {
      userId: String(row.user_id),
      emailEnabled: Boolean(row.email_enabled),
      pushEnabled: Boolean(row.push_enabled),
      orderUpdates: Boolean(row.order_updates),
      stockAlerts: Boolean(row.stock_alerts),
      deliveryUpdates: Boolean(row.delivery_updates),
    };
  }

  async listUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.handleError(error, 'Failed to list notifications');
    }

    return (data ?? []).map((row) => this.mapNotification(row));
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      this.handleError(error, 'Failed to get unread count');
    }

    return count ?? 0;
  }

  async markAsRead(userId: string, id: number): Promise<void> {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      this.handleError(error, 'Failed to mark notification as read');
    }

    if (!data) {
      throw new NotFoundException('Notification not found');
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      this.handleError(error, 'Failed to mark all notifications as read');
    }
  }

  async deleteNotification(userId: string, id: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'Failed to delete notification');
    }
  }

  async getSettings(userId: string): Promise<NotificationSettings> {
    const { data, error } = await this.supabase.client
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = No rows found
      this.handleError(error, 'Failed to get notification settings');
    }

    if (!data) {
      // Return defaults if no settings row exists
      return {
        userId,
        emailEnabled: true,
        pushEnabled: false,
        orderUpdates: true,
        stockAlerts: true,
        deliveryUpdates: true,
      };
    }

    return this.mapSettings(data);
  }

  async updateSettings(
    userId: string,
    partial: Partial<NotificationSettings>,
  ): Promise<NotificationSettings> {
    const existing = await this.getSettings(userId);

    const newSettings: NotificationSettings = {
      ...existing,
      ...partial,
      userId,
    };

    const { data, error } = await this.supabase.client
      .from('notification_settings')
      .upsert(
        {
          user_id: userId,
          email_enabled: newSettings.emailEnabled,
          push_enabled: newSettings.pushEnabled,
          order_updates: newSettings.orderUpdates,
          stock_alerts: newSettings.stockAlerts,
          delivery_updates: newSettings.deliveryUpdates,
        },
        { onConflict: 'user_id' },
      )
      .select('*')
      .single();

    if (error) {
      this.handleError(error, 'Failed to update notification settings');
    }

    return this.mapSettings(data);
  }
}
