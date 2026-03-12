'use client';

import type { Notification } from '@repo/types';
import { NotificationItem } from './notification-item';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onRead: (id: number) => void;
  onReadAll: () => void;
  onDelete: (id: number) => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onRead,
  onReadAll,
  onDelete,
}: NotificationDropdownProps) {
  return (
    <div className="absolute bottom-12 right-0 w-96 rounded-lg border bg-white shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-800">
          Thong bao {unreadCount > 0 && <span className="text-blue-600">({unreadCount})</span>}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={onReadAll}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            Doc tat ca
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <span className="text-3xl mb-2">🔔</span>
            <p className="text-sm">Khong co thong bao</p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onRead={onRead}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
