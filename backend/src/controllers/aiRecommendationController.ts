import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { getUserAIRecommendations, clearUserAICache } from '../services/ai/aiRecommendationService';

export const getAIRecommendationsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = await getUserAIRecommendations(userId, false);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch AI recommendations' });
  }
};

export const getAITeamRecommendationsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const data = await getUserAIRecommendations(userId, false);
    res.json({ success: true, data: data.teams });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch AI team recommendations' });
  }
};

export const refreshAIRecommendationsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    clearUserAICache(userId);
    const data = await getUserAIRecommendations(userId, true);
    res.json({ success: true, message: 'AI recommendations refreshed successfully', data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to refresh AI recommendations' });
  }
};
