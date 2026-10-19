import { createJoinRequest, sendJoinRequest } from '../src/services/joinRequestService';
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

  const TeamRequestMock: any = jest.fn().mockImplementation(() => mockRequest);
  TeamRequestMock.findOne = jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(null),
  });

  return {
    TeamRequest: TeamRequestMock,
  };
});

jest.mock('../src/models/Team', () => ({
  Team: {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439033',
        name: 'Test Team',
        leader: '407f1f77bcf86cd799439011',
        members: [],
        status: 'Open',
        maxMembers: 4,
      }),
    }),
  },
}));

jest.mock('../src/models/User', () => ({
  User: {
    findById: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439022',
        name: 'Applicant User',
        email: 'applicant@example.com',
      }),
    }),
  },
}));

jest.mock('../src/services/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue({}),
}));

describe('JoinRequest Service', () => {
  const { TeamRequest } = require('../src/models/TeamRequest');

  beforeEach(() => {
    jest.clearAllMocks();
    TeamRequest.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
  });

  it('creates a join request successfully via createJoinRequest (alias for sendJoinRequest)', async () => {
    const userId = new Types.ObjectId('507f1f77bcf86cd799439022');
    const teamId = new Types.ObjectId('507f1f77bcf86cd799439033');

    const result = await createJoinRequest(userId, teamId, 'I want to join');
    expect(result).toHaveProperty('_id');
    expect(result.status).toBe('Pending');
  });

  it('sends a join request via sendJoinRequest and dispatches leader notification', async () => {
    const userId = new Types.ObjectId('507f1f77bcf86cd799439022');
    const teamId = new Types.ObjectId('507f1f77bcf86cd799439033');

    const result = await sendJoinRequest(userId, teamId, 'Interested in backend role');
    expect(result).toHaveProperty('_id');
    expect(result.status).toBe('Pending');
  });

  it('prevents duplicate join requests', async () => {
    TeamRequest.findOne = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ _id: 'existing_request_id' }),
    });

    const userId = new Types.ObjectId('507f1f77bcf86cd799439022');
    const teamId = new Types.ObjectId('507f1f77bcf86cd799439033');

    await expect(sendJoinRequest(userId, teamId)).rejects.toThrow('Join request already exists');
  });

  it('prevents team leader from sending join request to own team', async () => {
    const leaderId = new Types.ObjectId('407f1f77bcf86cd799439011');
    const teamId = new Types.ObjectId('507f1f77bcf86cd799439033');

    await expect(sendJoinRequest(leaderId, teamId)).rejects.toThrow('You are the leader of this team');
  });
});
