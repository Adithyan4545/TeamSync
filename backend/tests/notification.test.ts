import { createNotification, markAsRead } from '../src/services/notificationService';
import { Types } from 'mongoose';

jest.mock('../src/models/Notification', () => {
  const mockNotification = {
    _id: '707f1f77bcf86cd799439011',
    user: '507f1f77bcf86cd799439022',
    type: 'HackathonPublished',
    payload: { hackathonId: 'some-id' },
    read: false,
    save: jest.fn().mockImplementation(function (this: any) {
      return Promise.resolve(this || mockNotification);
    }),
  };

  const NotificationMock: any = jest.fn().mockImplementation(() => ({
    ...mockNotification,
    save: jest.fn().mockResolvedValue({
      _id: '707f1f77bcf86cd799439011',
      user: '507f1f77bcf86cd799439022',
      type: 'HackathonPublished',
      payload: { hackathonId: 'some-id' },
      read: false,
    }),
  }));

  NotificationMock.findOne = jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(null),
  });

  NotificationMock.findById = jest.fn().mockResolvedValue(null);

  return {
    Notification: NotificationMock,
  };
});

describe('Notification Service', () => {
  const { Notification } = require('../src/models/Notification');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a notification when no duplicate exists', async () => {
    Notification.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    const userId = new Types.ObjectId('507f1f77bcf86cd799439022');
    const result = await createNotification(userId, 'HackathonPublished', { hackathonId: 'some-id' });

    expect(result).toHaveProperty('_id');
    expect(result.type).toBe('HackathonPublished');
    expect(result.read).toBe(false);
  });

  it('returns existing notification if duplicate exists within 10 seconds (deduplication)', async () => {
    const existingNotification = {
      _id: '707f1f77bcf86cd799439099',
      user: new Types.ObjectId('507f1f77bcf86cd799439022'),
      type: 'HackathonPublished',
      payload: { hackathonId: 'some-id' },
      read: false,
    };

    Notification.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(existingNotification),
    });

    const userId = new Types.ObjectId('507f1f77bcf86cd799439022');
    const result = await createNotification(userId, 'HackathonPublished', { hackathonId: 'some-id' });

    expect(result).toEqual(existingNotification);
    expect(Notification).not.toHaveBeenCalled();
  });

  it('marks a notification as read when authorized', async () => {
    const mockDoc = {
      _id: '707f1f77bcf86cd799439011',
      user: { toString: () => '507f1f77bcf86cd799439022' },
      read: false,
      save: jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve({ ...this });
      }),
    };

    Notification.findById = jest.fn().mockResolvedValue(mockDoc);

    const result = await markAsRead('707f1f77bcf86cd799439011', '507f1f77bcf86cd799439022');
    expect(result).not.toBeNull();
    expect(result!.read).toBe(true);
    expect(mockDoc.save).toHaveBeenCalledTimes(1);
  });

  it('throws an error if unauthorized user attempts to mark as read', async () => {
    const mockDoc = {
      _id: '707f1f77bcf86cd799439011',
      user: { toString: () => '507f1f77bcf86cd799439022' },
      read: false,
      save: jest.fn(),
    };

    Notification.findById = jest.fn().mockResolvedValue(mockDoc);

    await expect(
      markAsRead('707f1f77bcf86cd799439011', 'other_unauthorized_user')
    ).rejects.toThrow('Unauthorized to modify this notification');
  });

  it('returns null when notification does not exist', async () => {
    Notification.findById = jest.fn().mockResolvedValue(null);

    const result = await markAsRead('non_existent_id', '507f1f77bcf86cd799439022');
    expect(result).toBeNull();
  });
});
