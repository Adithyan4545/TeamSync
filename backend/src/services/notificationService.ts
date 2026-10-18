import { Notification, INotification } from '../models/Notification';
import { Types } from 'mongoose';

/** Service to create notifications with deduplication safety */
export const createNotification = async (
  userId: Types.ObjectId,
  type: INotification['type'],
  payload: any = {}
) => {
  // Deduplication safety check: prevent exact duplicate notification within 10 seconds
  const tenSecondsAgo = new Date(Date.now() - 10 * 1000);
  const existing = await Notification.findOne({
    user: userId,
    type,
    createdAt: { $gte: tenSecondsAgo },
  }).lean();

  if (existing) {
    return existing;
  }

  const notification = new Notification({ user: userId, type, payload });
  return await notification.save();
};

export const getUserNotifications = async (userId: Types.ObjectId, onlyUnread = false) => {
  const filter: any = { user: userId };
  if (onlyUnread) filter.read = false;
  return await Notification.find(filter).sort({ createdAt: -1 }).lean();
};

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) return null;

  if (notification.user.toString() !== userId) {
    throw new Error('Unauthorized to modify this notification');
  }

  notification.read = true;
  return await notification.save();
};

export const deleteNotification = async (notificationId: string, userId: string) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) return null;

  if (notification.user.toString() !== userId) {
    throw new Error('Unauthorized to delete this notification');
  }

  return await Notification.findByIdAndDelete(notificationId);
};
