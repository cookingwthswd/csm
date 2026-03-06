'use client';

import type { Notification } from '@repo/types';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}

const TYPE_ICONS: Record<string, string> = {
  order_created: '🛒',
  order_status_changed: '📋',
  production_completed: '✅',
  low_stock_alert: '⚠️',
  delivery_update: '🚚',
  system_announcement: '📢',
};

export function NotificationItem({ notification: n, onRead, onDelete }: NotificationItemProps) {
  return (
    <div
      className={`flex items-start gap-3 border-b px-4 py-3 last:border-b-0 transition-colors ${
        !n.isRead ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
      }`}
    >
      <span className="mt-0.5 text-lg shrink-0">{TYPE_ICONS[n.type] ?? '🔔'}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{n.title}</p>
        {n.message && <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>}
        <p className="mt-1 text-[10px] text-gray-400">{formatTime(n.createdAt)}</p>
      </div>

      <div className="flex flex-col gap-1 shrink-0">
        {!n.isRead && (
          <button
            onClick={() => onRead(n.id)}
            className="rounded p-1 text-xs text-blue-600 hover:bg-blue-100"
            title="Danh dau da doc"
          >
            ✓
          </button>
        )}
        <button
          onClick={() => onDelete(n.id)}
          className="rounded p-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
          title="Xoa"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vua xong';
    if (mins < 60) return `${mins} phut truoc`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} gio truoc`;
    const days = Math.floor(hours / 24);
    return `${days} ngay truoc`;
  } catch {
    return '';
  }
}
