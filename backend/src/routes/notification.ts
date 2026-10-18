import { Router } from 'express';
import { getUserNotificationsController, markNotificationReadController, deleteNotificationController } from '../controllers/notificationController';
import { verifyAccessToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', verifyAccessToken, getUserNotificationsController);
router.patch('/:id/read', verifyAccessToken, markNotificationReadController);
router.delete('/:id', verifyAccessToken, deleteNotificationController);

export default router;
