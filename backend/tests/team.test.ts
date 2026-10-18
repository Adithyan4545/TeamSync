import { createTeam } from '../src/services/teamService';
import { Types } from 'mongoose';

jest.mock('../src/models/Team', () => {
  const mockTeam = {
    _id: '507f1f77bcf86cd799439022',
    name: 'ByteBusters',
    maxMembers: 4,
    save: jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439022',
      name: 'ByteBusters',
      maxMembers: 4,
    }),
  };

  return {
    Team: jest.fn().mockImplementation(() => mockTeam),
  };
});

describe('Team Service', () => {
  it('creates a new team', async () => {
    const leaderId = new Types.ObjectId();
    const hackathonId = new Types.ObjectId();
    const result = await createTeam(
      {
        name: 'ByteBusters',
        hackathon: hackathonId as any,
        maxMembers: 4,
      },
      leaderId
    );
    expect(result).toHaveProperty('_id');
    expect(result.name).toBe('ByteBusters');
  });
});
