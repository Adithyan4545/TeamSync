import { createNotification, markAsRead } from '../src/services/notificationService';
import { Types } from 'mongoose';

jest.mock('../src/models/Notification', () => {
  const mockNotification = {
    _id: '707f1f77bcf86cd799439011',
    user: '507f1f77bcf86cd799439022',
    type: 'HackathonPublished',
    payload: { hackathonId: 'some-id' },
    read: false,
    save: jest.fn().mockResolvedValue({
      _id: '707f1f77bcf86cd799439011',
      user: '507f1f77bcf86cd799439022',
      type: 'HackathonPublished',
      payload: { hackathonId: 'some-id' },
      read: false,
    }),
  };

  return {
    Notification: jest.fn().mockImplementation(() => mockNotification),
  };
});

describe('Notification Service', () => {
  it('creates a notification', async () => {
    const userId = new Types.ObjectId('507f1f77bcf86cd799439022');
    
    const result = await createNotification(userId, 'HackathonPublished', { hackathonId: 'some-id' });
    expect(result).toHaveProperty('_id');
    expect(result.type).toBe('HackathonPublished');
    expect(result.read).toBe(false);
  });

  it('marks a notification as read', async () => {
    const mockFindByIdAndUpdate = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: '707f1f77bcf86cd799439011',
        read: true,
      })
    });
    require('../src/models/Notification').Notification.findByIdAndUpdate = mockFindByIdAndUpdate;
    
    const result = await markAsRead('707f1f77bcf86cd799439011', '507f1f77bcf86cd799439022');
    expect(result).not.toBeNull();
    expect(result!.read).toBe(true);
  });
});
