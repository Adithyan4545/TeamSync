import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export interface TeamFilterParams {
  q?: string;
  leader?: string;
  requiredSkills?: string[];
  openRoles?: string[];
  status?: string;
  hackathonId?: string;
  sortBy?: 'createdAt' | 'active' | 'openPositions';
  page?: number;
  limit?: number;
}

export function useTeams(initialParams: TeamFilterParams = {}) {
  const [params, setParams] = useState<TeamFilterParams>({ page: 1, limit: 12, ...initialParams });
  const [data, setData] = useState<{ items: any[]; total: number; page: number; limit: number }>({
    items: [],
    total: 0,
    page: 1,
    limit: 12,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/teams', { params });
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return {
    teams: data.items,
    total: data.total,
    page: data.page,
    limit: data.limit,
    loading,
    error,
    params,
    setParams,
    refetch: fetchTeams,
  };
}
