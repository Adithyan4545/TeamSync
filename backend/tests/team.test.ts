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

jest.mock('../src/models/Hackathon', () => ({
  Hackathon: {
    exists: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../src/models/ExternalHackathon', () => ({
  ExternalHackathon: {
    exists: jest.fn().mockResolvedValue(false),
  },
}));

describe('Team Service', () => {
  const { Hackathon } = require('../src/models/Hackathon');
  const { ExternalHackathon } = require('../src/models/ExternalHackathon');

  beforeEach(() => {
    jest.clearAllMocks();
    Hackathon.exists.mockResolvedValue(true);
    ExternalHackathon.exists.mockResolvedValue(false);
  });

  it('creates a new team when hackathon exists in internal records', async () => {
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
    expect(Hackathon.exists).toHaveBeenCalledWith({ _id: hackathonId });
  });

  it('creates a new team when hackathon exists in external records', async () => {
    Hackathon.exists.mockResolvedValue(false);
    ExternalHackathon.exists.mockResolvedValue(true);

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
    expect(ExternalHackathon.exists).toHaveBeenCalledWith({ _id: hackathonId });
  });

  it('throws an error if target hackathon is not found in either collection', async () => {
    Hackathon.exists.mockResolvedValue(false);
    ExternalHackathon.exists.mockResolvedValue(false);

    const leaderId = new Types.ObjectId();
    const hackathonId = new Types.ObjectId();

    await expect(
      createTeam(
        {
          name: 'ByteBusters',
          hackathon: hackathonId as any,
          maxMembers: 4,
        },
        leaderId
      )
    ).rejects.toThrow('Target hackathon record not found in MongoDB');
  });

  it('creates a team without a hackathon reference', async () => {
    const leaderId = new Types.ObjectId();
    const result = await createTeam(
      {
        name: 'Independent Team',
        maxMembers: 3,
      },
      leaderId
    );
    expect(result).toHaveProperty('_id');
    expect(Hackathon.exists).not.toHaveBeenCalled();
    expect(ExternalHackathon.exists).not.toHaveBeenCalled();
  });
});
