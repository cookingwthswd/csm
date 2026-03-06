'use client';

import { useNotifications } from '../hooks/use-notifications';
import { NotificationItem } from './notification-item';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thong bao</h1>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} thong bao chua doc` : 'Khong co thong bao moi'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Doc tat ca
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="rounded-lg border bg-white shadow-sm">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="text-5xl mb-3">🔔</span>
            <p className="text-lg">Khong co thong bao</p>
            <p className="text-sm">Cac thong bao moi se xuat hien o day</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>
    </div>
  );
}
