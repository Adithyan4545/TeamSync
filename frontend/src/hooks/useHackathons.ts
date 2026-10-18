import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export interface HackathonFilterParams {
  q?: string;
  theme?: string;
  difficulty?: string;
  mode?: string;
  status?: string;
  source?: 'all' | 'external' | 'community' | string;
  sourceProvider?: string;
  sourceType?: string;
  upcomingWindow?: 'all' | '35days';
  registrationFee?: 'all' | 'free' | 'paid';
  eligibility?: 'all' | 'students' | 'college_students' | 'working_professionals' | 'open_to_everyone';
  domain?: string;
  state?: string;
  city?: string;
  country?: string;
  minPrize?: number;
  maxPrize?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  requiredSkills?: string[];
  tags?: string[];
  sortBy?: 'recommended' | 'deadline' | 'eventDate' | 'newest' | 'createdAt' | 'prize' | 'popularity';
  page?: number;
  limit?: number;
}

export function useHackathons(filterParams: HackathonFilterParams = {}) {
  const [data, setData] = useState<{ items: any[]; total: number; page: number; limit: number }>({
    items: [],
    total: 0,
    page: 1,
    limit: 12,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const serializedParams = JSON.stringify(filterParams);

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/hackathons', { params: filterParams });
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch hackathons');
    } finally {
      setLoading(false);
    }
  }, [serializedParams]);

  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  return {
    hackathons: data.items,
    total: data.total,
    page: data.page,
    limit: data.limit,
    loading,
    error,
    params: filterParams,
    refetch: fetchHackathons,
  };
}
