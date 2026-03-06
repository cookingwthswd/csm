import { useEffect, useCallback } from 'react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/api/notifications';
import { useNotificationStore } from '@/lib/stores/notification.store';

export function useNotifications() {
  // Use individual selectors to avoid creating new object references each render
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setNotifications = useNotificationStore((s) => s.setNotifications);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const markAsReadLocally = useNotificationStore((s) => s.markAsRead);
  const markAllAsReadLocally = useNotificationStore((s) => s.markAllAsRead);

  useEffect(() => {
    void (async () => {
      try {
        const [list, count] = await Promise.all([
          fetchNotifications(),
          fetchUnreadCount(),
        ]);
        setNotifications(list);
        setUnreadCount(count);
      } catch {
        // API not available yet — silently ignore
      }
    })();
  }, [setNotifications, setUnreadCount]);

  const markAsRead = useCallback(async (id: number) => {
    await markNotificationAsRead(id);
    markAsReadLocally(id);
  }, [markAsReadLocally]);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    markAllAsReadLocally();
  }, [markAllAsReadLocally]);

  const remove = useCallback(async (id: number) => {
    await deleteNotification(id);
    useNotificationStore.getState().setNotifications(
      useNotificationStore.getState().notifications.filter((n) => n.id !== id),
    );
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification: remove,
  };
}

