import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { getUserNotifications, markAsRead, deleteNotification } from '../services/notificationService';
import { Types } from 'mongoose';

export const getUserNotificationsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const onlyUnread = req.query.unread === 'true';
    const notifications = await getUserNotifications(userId, onlyUnread);
    res.json(notifications);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const markNotificationReadController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const notification = await markAsRead(id, userId);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json(notification);
  } catch (err: any) {
    if (err.message === 'Unauthorized to modify this notification') {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};

export const deleteNotificationController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await deleteNotification(id, userId);
    if (!result) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err: any) {
    if (err.message === 'Unauthorized to delete this notification') {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
};
