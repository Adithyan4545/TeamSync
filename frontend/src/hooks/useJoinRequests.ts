import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuth } from './useAuth';

export function useJoinRequests() {
  const { user } = useAuth();
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [leaderRequests, setLeaderRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRequests = useCallback(async () => {
    if (!user || user.role !== 'student') return;
    try {
      const res = await api.get('/join-requests/my-requests');
      setUserRequests(res.data);
    } catch (err: any) {
      // Error handled by interceptor
    }
  }, [user]);

  const fetchLeaderRequests = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/join-requests/leader-requests');
      setLeaderRequests(res.data);
    } catch (err: any) {
      // Error handled by interceptor
    }
  }, [user]);

  const refreshAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    await Promise.all([
      fetchUserRequests(),
      fetchLeaderRequests()
    ]);
    setLoading(false);
  }, [fetchUserRequests, fetchLeaderRequests, user]);

  const sendRequest = async (teamId: string) => {
    await api.post('/join-requests', { teamId });
    await fetchUserRequests();
  };

  const cancelRequest = async (teamId: string) => {
    await api.delete(`/join-requests/${teamId}`);
    await fetchUserRequests();
  };

  const updateStatus = async (requestId: string, status: 'Accepted' | 'Rejected' | 'Shortlisted') => {
    await api.patch(`/join-requests/${requestId}/status`, { status });
    await fetchLeaderRequests();
  };

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    userRequests,
    leaderRequests,
    loading,
    error,
    sendRequest,
    cancelRequest,
    updateStatus,
    refreshAll,
  };
}
