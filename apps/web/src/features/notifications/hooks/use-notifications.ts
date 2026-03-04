import { useEffect } from 'react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/lib/api/notifications';
import { useNotificationStore } from '@/lib/stores/notification.store';

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    setNotifications,
    setUnreadCount,
    markAsReadLocally,
    markAllAsReadLocally,
    removeNotificationLocally,
  } = useNotificationStore((state) => ({
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    setNotifications: state.setNotifications,
    setUnreadCount: state.setUnreadCount,
    markAsReadLocally: state.markAsRead,
    markAllAsReadLocally: state.markAllAsRead,
    removeNotificationLocally: (id: number) =>
      state.setNotifications(state.notifications.filter((n) => n.id !== id)),
  }));

  useEffect(() => {
    void (async () => {
      const [list, count] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    })();
  }, [setNotifications, setUnreadCount]);

  const markAsRead = async (id: number) => {
    await markNotificationAsRead(id);
    markAsReadLocally(id);
  };

  const markAllAsRead = async () => {
    await markAllNotificationsAsRead();
    markAllAsReadLocally();
  };

  const remove = async (id: number) => {
    await deleteNotification(id);
    removeNotificationLocally(id);
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification: remove,
  };
}

