import { Router } from 'express';
import { verifyAccessToken, optionalAccessToken } from '../middleware/authMiddleware';
import {
  getAIRecommendationsController,
  getAITeamRecommendationsController,
  refreshAIRecommendationsController,
} from '../controllers/aiRecommendationController';
import { handleAIChatController } from '../controllers/aiChatbotController';

const router = Router();

router.get('/recommendations', verifyAccessToken, getAIRecommendationsController);
router.get('/teams', verifyAccessToken, getAITeamRecommendationsController);
router.post('/refresh', verifyAccessToken, refreshAIRecommendationsController);
router.post('/chat', optionalAccessToken, handleAIChatController);

export default router;
