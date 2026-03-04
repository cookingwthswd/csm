import { useNotifications } from '../hooks/use-notifications';

interface NotificationBellProps {
  onClick?: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { unreadCount } = useNotifications();

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center rounded-full p-2 text-gray-600 hover:bg-gray-100"
      aria-label="Notifications"
    >
      <span className="inline-block h-5 w-5 rounded-full border border-gray-500" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

