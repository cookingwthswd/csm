import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { PostgrestError } from '@supabase/supabase-js';
import type {
  Database,
  Notification,
  NotificationSettings,
  NotificationType,
} from '@repo/types';
import { SupabaseService } from '../common';
import { EmailProvider } from './providers/email.provider';
import { PushProvider } from './providers/push.provider';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly emailProvider: EmailProvider,
    private readonly pushProvider: PushProvider,
  ) {}

  private handleError(error: PostgrestError, context: string): never {
    // eslint-disable-next-line no-console
    console.error('[NotificationsService]', context, error);
    throw new InternalServerErrorException(`Database error: ${context}`);
  }

  private mapNotification(row: Database['public']['Tables']['notifications']['Row']): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as Notification['type'],
      title: row.title,
      message: row.message,
      data: row.data as Record<string, any> | null,
      isRead: row.is_read,
      createdAt: row.created_at,
    };
  }

  private mapSettings(
    row: Database['public']['Tables']['notification_settings']['Row'],
  ): NotificationSettings {
    return {
      userId: row.user_id,
      emailEnabled: row.email_enabled,
      pushEnabled: row.push_enabled,
      orderUpdates: row.order_updates,
      stockAlerts: row.stock_alerts,
      deliveryUpdates: row.delivery_updates,
    };
  }

  // ── Create notification (called by other services) ─────────────────

  async create(dto: {
    userId: string;
    type: NotificationType;
    title: string;
    message?: string | null;
    data?: Record<string, any> | null;
  }): Promise<Notification> {
    const { data, error } = await this.supabase.client
      .from('notifications')
      .insert({
        user_id: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message ?? null,
        data: (dto.data ?? null) as any,
        is_read: false,
      })
      .select('*')
      .single();

    if (error) {
      this.handleError(error, 'Failed to create notification');
    }

    const notification = this.mapNotification(data);

    // Check user settings and dispatch email/push if enabled
    try {
      const settings = await this.getSettings(dto.userId);
      if (settings.emailEnabled) {
        await this.emailProvider.send(notification, dto.userId);
      }
      if (settings.pushEnabled) {
        await this.pushProvider.send(notification, dto.userId);
      }
    } catch {
      // Don't fail the notification creation if providers fail
    }

    return notification;
  }

  // ── Convenience methods for other modules ──────────────────────────

  async notifyOrderCreated(userId: string, orderId: number, storeName: string) {
    return this.create({
      userId,
      type: 'order_created',
      title: `Don hang moi #${orderId}`,
      message: `${storeName} vua dat don hang moi`,
      data: { orderId },
    });
  }

  async notifyOrderStatusChanged(userId: string, orderId: number, newStatus: string) {
    return this.create({
      userId,
      type: 'order_status_changed',
      title: `Don hang #${orderId} cap nhat`,
      message: `Trang thai moi: ${newStatus}`,
      data: { orderId, status: newStatus },
    });
  }

  async notifyLowStock(userId: string, itemName: string, currentQty: number) {
    return this.create({
      userId,
      type: 'low_stock_alert',
      title: `Canh bao ton kho thap`,
      message: `${itemName} chi con ${currentQty}`,
      data: { itemName, currentQty },
    });
  }

  async notifyProductionCompleted(userId: string, batchCode: string) {
    return this.create({
      userId,
      type: 'production_completed',
      title: `San xuat hoan tat`,
      message: `Lo ${batchCode} da hoan thanh`,
      data: { batchCode },
    });
  }

  async notifyDeliveryUpdate(userId: string, shipmentId: number, status: string) {
    return this.create({
      userId,
      type: 'delivery_update',
      title: `Cap nhat giao hang`,
      message: `Don giao hang #${shipmentId}: ${status}`,
      data: { shipmentId, status },
    });
  }

  // ── List / Read / Delete ───────────────────────────────────────────

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

  // ── Settings ───────────────────────────────────────────────────────

  async getSettings(userId: string): Promise<NotificationSettings> {
    const { data, error } = await this.supabase.client
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.handleError(error, 'Failed to get notification settings');
    }

    if (!data) {
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
