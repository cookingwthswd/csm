import { create } from 'zustand';
import type { Notification } from '@repo/types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (list: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (n: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (list) =>
    set({
      notifications: list,
      unreadCount: list.filter((n) => !n.isRead).length,
    }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  addNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + (n.isRead ? 0 : 1),
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(
        0,
        state.unreadCount - (state.notifications.find((n) => n.id === id && !n.isRead) ? 1 : 0),
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
}));

