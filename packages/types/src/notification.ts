import { z } from 'zod';

export const NotificationType = z.enum([
  'order_created',
  'order_status_changed',
  'production_completed',
  'low_stock_alert',
  'delivery_update',
  'system_announcement',
]);
export type NotificationType = z.infer<typeof NotificationType>;

export const Notification = z.object({
  id: z.number(),
  userId: z.string(),
  type: NotificationType,
  title: z.string(),
  message: z.string().nullable(),
  data: z.record(z.string(), z.any()).nullable().optional(),
  isRead: z.boolean(),
  createdAt: z.string(),
});
export type Notification = z.infer<typeof Notification>;

export const NotificationSettings = z.object({
  userId: z.string(),
  emailEnabled: z.boolean(),
  pushEnabled: z.boolean(),
  orderUpdates: z.boolean(),
  stockAlerts: z.boolean(),
  deliveryUpdates: z.boolean(),
});
export type NotificationSettings = z.infer<typeof NotificationSettings>;

export const NotificationListResponse = z.object({
  notifications: z.array(Notification),
});
export type NotificationListResponse = z.infer<typeof NotificationListResponse>;

export const UnreadCountResponse = z.object({
  unreadCount: z.number(),
});
export type UnreadCountResponse = z.infer<typeof UnreadCountResponse>;

export const UpdateNotificationSettingsDto = NotificationSettings.partial();
export type UpdateNotificationSettingsDto = z.infer<typeof UpdateNotificationSettingsDto>;

