import { createHackathon, getHackathon, searchHackathons } from '../src/services/hackathonService';
import { Types } from 'mongoose';

// Mock Mongoose model
jest.mock('../src/models/Hackathon', () => {
  const mockHackathon = {
    _id: '507f1f77bcf86cd799439011',
    title: 'AI Innovators 2026',
    description: 'Build futuristic AI apps',
    mode: 'Online',
    save: jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      title: 'AI Innovators 2026',
      description: 'Build futuristic AI apps',
      mode: 'Online',
    }),
  };

  return {
    Hackathon: jest.fn().mockImplementation(() => mockHackathon),
  };
});

describe('Hackathon Service', () => {
  it('creates a new hackathon', async () => {
    const adminId = new Types.ObjectId();
    const result = await createHackathon(
      {
        title: 'AI Innovators 2026',
        description: 'Build futuristic AI apps',
        mode: 'Online',
      },
      adminId
    );
    expect(result).toHaveProperty('_id');
    expect(result.title).toBe('AI Innovators 2026');
  });
});
