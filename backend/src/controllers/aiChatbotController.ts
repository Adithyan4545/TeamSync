import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { handleAIChat } from '../services/ai/aiChatbotService';

export const handleAIChatController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || (req.user as any)?._id ? String(req.user?.id || (req.user as any)?._id) : undefined;
    const clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';

    const response = await handleAIChat(req.body, userId, clientIp);
    res.json(response);
  } catch (err: any) {
    console.error('❌ [aiChatbotController] Chat handler error:', err.message || err);
    res.status(err.message?.includes('Rate limit') ? 429 : 500).json({ error: err.message || 'AI Chatbot service error' });
  }
};
