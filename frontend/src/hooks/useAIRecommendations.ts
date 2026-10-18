import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';

export interface HackathonRecommendationItem {
  hackathon: any;
  matchScore: number;
  reason: string;
  matchedSkills: string[];
  missingSkills: string[];
  difficulty: string;
  learningValue: string;
}

export interface TeamRecommendationItem {
  team: any;
  compatibilityScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  teamNeeds: string[];
  explanation: string;
}

export interface AIRecommendationData {
  hackathons: HackathonRecommendationItem[];
  teams: TeamRecommendationItem[];
  insights: {
    summary: string;
    topSkillToLearn: string;
    recommendedRole: string;
  };
  isFallback?: boolean;
  message?: string;
}

export function useAIRecommendations() {
  const [data, setData] = useState<AIRecommendationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const endpoint = isRefresh ? '/ai/refresh' : '/ai/recommendations';
      const method = isRefresh ? api.post : api.get;
      const res = await method(endpoint);

      if (res.data.success) {
        setData(res.data.data);
      } else {
        setError(res.data.message || 'Failed to fetch AI recommendations');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'AI recommendations temporarily unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendations(false);
  }, [fetchRecommendations]);

  return {
    recommendations: data?.hackathons || [],
    teamRecommendations: data?.teams || [],
    insights: data?.insights,
    isFallback: data?.isFallback,
    message: data?.message,
    loading,
    refreshing,
    error,
    refresh: () => fetchRecommendations(true),
  };
}
