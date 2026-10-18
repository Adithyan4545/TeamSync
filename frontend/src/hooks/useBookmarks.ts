import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookmarks');
      setBookmarks(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch bookmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  const bookmarkHackathon = async (hackathonId: string) => {
    await api.post(`/bookmarks/hackathons/${hackathonId}`);
    await fetchBookmarks();
  };

  const unbookmarkHackathon = async (hackathonId: string) => {
    await api.delete(`/bookmarks/hackathons/${hackathonId}`);
    await fetchBookmarks();
  };

  const bookmarkTeam = async (teamId: string) => {
    await api.post(`/bookmarks/teams/${teamId}`);
    await fetchBookmarks();
  };

  const unbookmarkTeam = async (teamId: string) => {
    await api.delete(`/bookmarks/teams/${teamId}`);
    await fetchBookmarks();
  };

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return {
    bookmarks,
    loading,
    error,
    bookmarkHackathon,
    unbookmarkHackathon,
    bookmarkTeam,
    unbookmarkTeam,
    refetch: fetchBookmarks,
  };
}
