import { createJoinRequest } from '../src/services/joinRequestService';
import { Types } from 'mongoose';

jest.mock('../src/models/TeamRequest', () => {
  const mockRequest = {
    _id: '607f1f77bcf86cd799439011',
    user: '507f1f77bcf86cd799439022',
    team: '507f1f77bcf86cd799439033',
    status: 'Pending',
    save: jest.fn().mockResolvedValue({
      _id: '607f1f77bcf86cd799439011',
      user: '507f1f77bcf86cd799439022',
      team: '507f1f77bcf86cd799439033',
      status: 'Pending',
    }),
  };

  return {
    TeamRequest: jest.fn().mockImplementation(() => mockRequest),
  };
});

jest.mock('../src/models/Team', () => ({
  Team: {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439033',
        leader: '407f1f77bcf86cd799439011',
        members: []
      })
    })
  }
}));

describe('JoinRequest Service', () => {
  it('creates a join request', async () => {
    // Override TeamRequest.findOne to simulate no existing request
    const mockFindOne = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    require('../src/models/TeamRequest').TeamRequest.findOne = mockFindOne;

    const userId = new Types.ObjectId('507f1f77bcf86cd799439022');
    const teamId = new Types.ObjectId('507f1f77bcf86cd799439033');
    
    const result = await createJoinRequest(userId, teamId, "I want to join");
    expect(result).toHaveProperty('_id');
    expect(result.status).toBe('Pending');
  });
});
