import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export function useNotifications(onlyUnread = true) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications', { params: { unread: onlyUnread } });
      setNotifications(res.data);
    } catch (err) {
      // Ignore if unauthenticated
    } finally {
      setLoading(false);
    }
  }, [onlyUnread]);

  const markRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    await fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    markRead,
    refetch: fetchNotifications,
  };
}
