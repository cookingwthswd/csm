'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useNotificationStore } from '@/lib/stores/notification.store';
import { toast } from 'sonner';
import type { Notification } from '@repo/types';

/**
 * Subscribe to Supabase Realtime for new notifications.
 * Shows toast and updates Zustand store on INSERT.
 */
export function useNotificationRealtime(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as any;
          const notification: Notification = {
            id: row.id,
            userId: row.user_id,
            type: row.type,
            title: row.title,
            message: row.message,
            data: row.data,
            isRead: row.is_read,
            createdAt: row.created_at,
          };

          // Add to store
          useNotificationStore.getState().addNotification(notification);

          // Show toast
          toast.info(notification.title, {
            description: notification.message ?? undefined,
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);
}
