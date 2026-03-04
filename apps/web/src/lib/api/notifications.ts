import { api } from './client';
import type {
  Notification,
  NotificationSettings,
  UpdateNotificationSettingsDto,
} from '@repo/types';

export async function fetchNotifications(): Promise<Notification[]> {
  return api.get<Notification[]>('/notifications');
}

export async function fetchUnreadCount(): Promise<number> {
  const { unreadCount } = await api.get<{ unreadCount: number }>(
    '/notifications/unread-count',
  );
  return unreadCount;
}

export async function markNotificationAsRead(id: number): Promise<void> {
  await api.put(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await api.put('/notifications/read-all', {});
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/notifications/${id}`);
}

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  return api.get<NotificationSettings>('/notifications/settings');
}

export async function updateNotificationSettings(
  dto: Partial<UpdateNotificationSettingsDto>,
): Promise<NotificationSettings> {
  return api.put<NotificationSettings>('/notifications/settings', dto);
}

