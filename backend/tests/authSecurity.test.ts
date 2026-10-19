import { register, login, logout, logoutAll, requestPasswordReset, refreshAccessToken } from '../src/services/authService';
import {
  getTeamController,
  updateTeamController,
  deleteTeamController,
  archiveTeamController,
  removeMemberController,
  transferLeadershipController,
} from '../src/controllers/teamController';
import { AuthRequest } from '../src/middleware/authMiddleware';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import express from 'express';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { JWT_ACCESS_SECRET } from '../src/config/jwt';

// Mock email transporter
jest.mock('../src/config/email', () => ({
  emailTransporter: {
    sendMail: jest.fn((options, cb) => cb(null, { response: 'ok' })),
  },
}));

// Mock User model
const mockSavedUsers: any[] = [];
jest.mock('../src/models/User', () => {
  const mockUserInstance = function (this: any, data: any) {
    Object.assign(this, data);
    this._id = this._id || new Types.ObjectId();
    this.save = jest.fn().mockImplementation(async () => {
      mockSavedUsers.push(this);
      return this;
    });
  };

  const UserMock: any = jest.fn().mockImplementation(mockUserInstance);
  UserMock.findOne = jest.fn();
  UserMock.updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  UserMock.findById = jest.fn();
  UserMock.findByIdAndUpdate = jest.fn();
  UserMock.create = jest.fn().mockImplementation(async (data: any) => {
    const user = new UserMock(data);
    await user.save();
    return user;
  });

  return {
    User: UserMock,
    UserRole: {
      STUDENT: 'student',
      LEADER: 'leader',
      ADMIN: 'admin',
    },
  };
});

// Mock Team service for controller tests
jest.mock('../src/services/teamService', () => ({
  createTeam: jest.fn().mockResolvedValue({ _id: 'team_1', name: 'Created Team' }),
  getTeam: jest.fn(),
  updateTeam: jest.fn().mockResolvedValue({ _id: 'team_1', name: 'Updated Team' }),
  deleteTeam: jest.fn().mockResolvedValue({ _id: 'team_1' }),
  archiveTeam: jest.fn().mockResolvedValue({ _id: 'team_1', status: 'Archived' }),
  removeMember: jest.fn().mockResolvedValue({ _id: 'team_1' }),
  transferLeadership: jest.fn().mockResolvedValue({ _id: 'team_1', leader: 'new_leader_id' }),
}));

import authRoutes from '../src/routes/auth';
import userRoutes from '../src/routes/user';
import teamRoutes from '../src/routes/team';

describe('Authentication & Authorization Security Suite', () => {
  const { User } = require('../src/models/User');
  const {
    createTeam,
    getTeam,
    updateTeam,
    deleteTeam,
    removeMember,
    transferLeadership,
  } = require('../src/services/teamService');

  let testApp: express.Express;

  beforeAll(() => {
    testApp = express();
    testApp.use(express.json());
    testApp.use(cookieParser());
    testApp.use('/api/auth', authRoutes);
    testApp.use('/api/users', userRoutes);
    testApp.use('/api/teams', teamRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    User.findOne.mockReset();
    User.findById.mockReset();
    User.findByIdAndUpdate.mockReset();
    User.updateOne.mockReset().mockResolvedValue({ modifiedCount: 1 });
    mockSavedUsers.length = 0;
  });

  describe('Registration Security & Role Elevation Prevention', () => {
    it('rejects registration with invalid or non-string inputs', async () => {
      await expect(register('' as any, 'user@example.com', 'ValidPass123!')).rejects.toThrow('Name is required');
      await expect(register('User', '' as any, 'ValidPass123!')).rejects.toThrow('A valid email address is required');
      await expect(register('User', 'notanemail', 'ValidPass123!')).rejects.toThrow('A valid email address is required');
      await expect(register('User', 'user@example.com', '' as any)).rejects.toThrow('Password is required');
    });

    it('rejects passwords that fail complexity requirements', async () => {
      // Missing special char
      await expect(register('User', 'user@example.com', 'Password123')).rejects.toThrow('Password does not meet security requirements');
      // Missing number
      await expect(register('User', 'user@example.com', 'Password!@#')).rejects.toThrow('Password does not meet security requirements');
      // Too short (< 8 chars)
      await expect(register('User', 'user@example.com', 'P1!pass')).rejects.toThrow('Password does not meet security requirements');
    });

    it('normalizes email to lowercase and prevents duplicate accounts case-insensitively', async () => {
      User.findOne.mockResolvedValueOnce({ _id: 'existing_id', email: 'test@example.com' });

      await expect(register('Alice', '  TEST@Example.COM  ', 'StrongPass123!')).rejects.toThrow('Email already in use');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    });

    it('strictly prevents role escalation to admin on public registration', async () => {
      User.findOne.mockResolvedValueOnce(null);

      // Attempt to self-register as admin
      await register('Hacker', 'hacker@example.com', 'AdminPass123!', 'admin');

      expect(mockSavedUsers.length).toBe(1);
      expect(mockSavedUsers[0].role).toBe('student');
      expect(mockSavedUsers[0].email).toBe('hacker@example.com');
    });

    it('does not log raw verification URL or token in production mode when email delivery fails', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const { emailTransporter } = require('../src/config/email');
      emailTransporter.sendMail.mockImplementationOnce((opts: any, cb: any) => cb(new Error('SMTP connection failed')));
      User.findOne.mockResolvedValueOnce(null);

      await register('NoLeak', 'noleak@example.com', 'ValidPass123!');

      const loggedCalls = consoleLogSpy.mock.calls.map(args => args.join(' '));
      const leakedUrl = loggedCalls.some(call => call.includes('verify-email') || call.includes('Verification URL'));
      expect(leakedUrl).toBe(false);

      consoleLogSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Login & Credential Verification', () => {
    it('normalizes email and rejects non-existent account with generic 401', async () => {
      User.findOne.mockResolvedValueOnce(null);

      await expect(login('NonExistent@Example.COM', 'AnyPass123!', false)).rejects.toThrow('Invalid credentials');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com', isDeleted: { $ne: true } });
    });

    it('rejects invalid password with generic 401', async () => {
      const hashed = await bcrypt.hash('CorrectPass123!', 10);
      User.findOne.mockResolvedValueOnce({
        id: 'u1',
        email: 'user@example.com',
        password: hashed,
        role: 'student',
        save: jest.fn().mockResolvedValue(true),
      });

      await expect(login('user@example.com', 'WrongPassword123!', false)).rejects.toThrow('Invalid credentials');
    });

    it('issues access and refresh tokens on valid credentials', async () => {
      const hashed = await bcrypt.hash('CorrectPass123!', 10);
      const mockUser = {
        id: 'u1',
        email: 'user@example.com',
        password: hashed,
        role: 'student',
        refreshTokens: [],
        save: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockResolvedValueOnce(mockUser);

      const result = await login('  USER@example.COM ', 'CorrectPass123!', false);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.cookieOptions.httpOnly).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('Logout & Session Revocation Security', () => {
    it('rejects unauthenticated attempts to clear arbitrary user sessions via req.body.userId', async () => {
      const victimUserId = new Types.ObjectId().toString();
      const res = await request(testApp)
        .post('/api/auth/logout')
        .send({ userId: victimUserId });

      expect(res.status).toBe(200);
      expect(User.updateOne).not.toHaveBeenCalledWith(
        { _id: victimUserId },
        { $set: { refreshTokens: [] } }
      );
    });

    it('revokes only the specific refresh token presented via cookie', async () => {
      const res = await request(testApp)
        .post('/api/auth/logout')
        .set('Cookie', ['refreshToken=cookie_token_123']);

      expect(res.status).toBe(200);
      expect(User.updateOne).toHaveBeenCalledWith(
        { 'refreshTokens.token': 'cookie_token_123' },
        { $pull: { refreshTokens: { token: 'cookie_token_123' } } }
      );
    });

    it('revokes only the specific refresh token presented via request body', async () => {
      const res = await request(testApp)
        .post('/api/auth/logout')
        .send({ refreshToken: 'body_token_456' });

      expect(res.status).toBe(200);
      expect(User.updateOne).toHaveBeenCalledWith(
        { 'refreshTokens.token': 'body_token_456' },
        { $pull: { refreshTokens: { token: 'body_token_456' } } }
      );
    });

    it('ensures ordinary logout service is incapable of clearing all refresh tokens even if userId is passed', async () => {
      const victimUserId = new Types.ObjectId().toString();
      await logout(undefined, undefined);
      expect(User.updateOne).not.toHaveBeenCalled();

      // Passing userId to ordinary logout does not clear tokens
      await logout(victimUserId as any);
      expect(User.updateOne).not.toHaveBeenCalledWith(
        expect.anything(),
        { $set: { refreshTokens: [] } }
      );
    });

    it('allows dedicated authenticated logoutAll service to revoke all sessions', async () => {
      const validUserId = new Types.ObjectId().toString();
      await logoutAll(validUserId);
      expect(User.updateOne).toHaveBeenCalledWith(
        { _id: validUserId },
        { $set: { refreshTokens: [] } }
      );
    });
  });

  describe('Password Reset Token Security', () => {
    it('does not log raw password reset URL or token in production mode when email delivery fails', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const { emailTransporter } = require('../src/config/email');
      emailTransporter.sendMail.mockImplementationOnce((opts: any, cb: any) => cb(new Error('SMTP down')));
      User.findOne.mockResolvedValueOnce({
        email: 'user@example.com',
        save: jest.fn().mockResolvedValue(true),
      });

      await requestPasswordReset('user@example.com');

      const loggedCalls = consoleLogSpy.mock.calls.map(args => args.join(' '));
      const leakedUrl = loggedCalls.some(call => call.includes('reset-password') || call.includes('Reset URL'));
      expect(leakedUrl).toBe(false);

      consoleLogSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Team Resource Authorization & Mutation Protection', () => {
    it('returns 400 when team ID is malformed (not a valid ObjectId)', async () => {
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const req: Partial<AuthRequest> = {
        params: { id: 'invalid-not-an-objectid' },
        user: { id: 'user_1', role: 'leader' },
      };

      await getTeamController(req as AuthRequest, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid team ID format' });

      await updateTeamController(req as AuthRequest, res as any);
      expect(res.status).toHaveBeenCalledWith(400);

      await deleteTeamController(req as AuthRequest, res as any);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects team update if requester is not the team leader or admin', async () => {
      getTeam.mockResolvedValueOnce({
        _id: 'team_1',
        name: 'Alpha Team',
        leader: { _id: 'leader_owner_id' },
        members: [],
      });

      const validTeamId = new Types.ObjectId().toString();
      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        body: { name: 'Hacked Name' },
        user: { id: 'attacker_student_id', role: 'student' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateTeamController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden: Only the team leader or an admin can update this team' });
      expect(updateTeam).not.toHaveBeenCalled();
    });

    it('rejects team update attempting to modify protected fields', async () => {
      getTeam.mockResolvedValueOnce({
        _id: 'team_1',
        name: 'Alpha Team',
        leader: { _id: 'leader_id' },
        members: [],
      });

      const validTeamId = new Types.ObjectId().toString();
      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        body: { leader: 'new_hacked_leader_id', name: 'Valid Name' },
        user: { id: 'leader_id', role: 'leader' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateTeamController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining('Cannot modify protected team fields: leader'),
      }));
      expect(updateTeam).not.toHaveBeenCalled();
    });

    it('rejects team update when no valid editable fields are provided', async () => {
      getTeam.mockResolvedValueOnce({
        _id: 'team_1',
        name: 'Alpha Team',
        leader: { _id: 'leader_id' },
        members: [],
      });

      const validTeamId = new Types.ObjectId().toString();
      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        body: { unknownField: 'test' },
        user: { id: 'leader_id', role: 'leader' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateTeamController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No valid editable fields provided' });
      expect(updateTeam).not.toHaveBeenCalled();
    });

    it('allows team update with allowed fields if requester is team leader', async () => {
      getTeam.mockResolvedValueOnce({
        _id: 'team_1',
        name: 'Alpha Team',
        leader: { _id: 'legit_leader_id' },
        members: [],
      });

      const validTeamId = new Types.ObjectId().toString();
      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        body: { name: 'New Team Name', description: 'Updated description', ignoredExtraField: 'ignore_me' },
        user: { id: 'legit_leader_id', role: 'leader' },
      };
      const res: Partial<any> = {
        json: jest.fn(),
      };

      await updateTeamController(req as AuthRequest, res as any);

      expect(updateTeam).toHaveBeenCalledWith(validTeamId, {
        name: 'New Team Name',
        description: 'Updated description',
      });
      expect(res.json).toHaveBeenCalled();
    });

    it('rejects team deletion if requester is not leader or admin', async () => {
      getTeam.mockResolvedValueOnce({
        _id: 'team_1',
        leader: 'leader_owner_id',
        members: [],
      });

      const validTeamId = new Types.ObjectId().toString();
      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        user: { id: 'attacker_student_id', role: 'student' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await deleteTeamController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(deleteTeam).not.toHaveBeenCalled();
    });
  });

  describe('Leadership Transfer Security', () => {
    it('rejects leadership transfer if newLeaderId is not a valid ObjectId', async () => {
      const validTeamId = new Types.ObjectId().toString();
      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        body: { newLeaderId: 'not-a-valid-id' },
        user: { id: 'leader_id', role: 'leader' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await transferLeadershipController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'A valid newLeaderId is required' });
    });

    it('rejects leadership transfer if requester is not the team leader or admin', async () => {
      const validTargetId = new Types.ObjectId().toString();
      const validTeamId = new Types.ObjectId().toString();
      getTeam.mockResolvedValueOnce({
        _id: validTeamId,
        leader: 'actual_leader_id',
        members: [{ _id: validTargetId }],
      });

      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        body: { newLeaderId: validTargetId },
        user: { id: 'student_imposter', role: 'student' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await transferLeadershipController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('rejects leadership transfer if target user does not exist or is deleted', async () => {
      const validTargetId = new Types.ObjectId().toString();
      const validTeamId = new Types.ObjectId().toString();
      getTeam.mockResolvedValueOnce({
        _id: validTeamId,
        leader: 'leader_id',
        members: [{ _id: validTargetId }],
      });
      User.findById.mockResolvedValueOnce(null);

      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        body: { newLeaderId: validTargetId },
        user: { id: 'leader_id', role: 'leader' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await transferLeadershipController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Target user not found or inactive' });
    });

    it('rejects leadership transfer if target user is not already a team member', async () => {
      const nonMemberId = new Types.ObjectId().toString();
      const validTeamId = new Types.ObjectId().toString();
      getTeam.mockResolvedValueOnce({
        _id: validTeamId,
        leader: 'leader_id',
        members: [{ _id: new Types.ObjectId().toString() }],
      });
      User.findById.mockResolvedValueOnce({ _id: nonMemberId, isDeleted: false });

      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        body: { newLeaderId: nonMemberId },
        user: { id: 'leader_id', role: 'leader' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await transferLeadershipController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Target user must already be a member of the team to become leader',
      });
    });

    it('rejects leadership transfer if target user is already the leader', async () => {
      const leaderId = new Types.ObjectId().toString();
      const validTeamId = new Types.ObjectId().toString();
      getTeam.mockResolvedValueOnce({
        _id: validTeamId,
        leader: { _id: leaderId },
        members: [{ _id: leaderId }],
      });

      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        body: { newLeaderId: leaderId },
        user: { id: leaderId, role: 'leader' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await transferLeadershipController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Target user is already the team leader' });
    });

    it('successfully transfers leadership when valid member is specified by leader', async () => {
      const memberId = new Types.ObjectId().toString();
      const leaderId = new Types.ObjectId().toString();
      const validTeamId = new Types.ObjectId().toString();
      getTeam.mockResolvedValueOnce({
        _id: validTeamId,
        leader: { _id: leaderId },
        members: [{ _id: leaderId }, { _id: memberId }],
      });
      User.findById.mockResolvedValueOnce({ _id: memberId, isDeleted: false });

      const req: Partial<AuthRequest> = {
        params: { id: validTeamId },
        body: { newLeaderId: memberId },
        user: { id: leaderId, role: 'leader' },
      };
      const res: Partial<any> = {
        json: jest.fn(),
      };

      await transferLeadershipController(req as AuthRequest, res as any);

      expect(transferLeadership).toHaveBeenCalledWith(validTeamId, expect.any(Types.ObjectId));
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('Member Removal Security', () => {
    it('rejects member removal with invalid memberId', async () => {
      const validTeamId = new Types.ObjectId().toString();
      const req: Partial<AuthRequest> = {
        params: { id: validTeamId, memberId: 'invalid-id' },
        user: { id: 'leader_id', role: 'leader' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await removeMemberController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'A valid memberId is required' });
    });

    it('rejects member removal if requester is an unrelated student', async () => {
      const targetMemberId = new Types.ObjectId().toString();
      const validTeamId = new Types.ObjectId().toString();
      getTeam.mockResolvedValueOnce({
        _id: validTeamId,
        leader: new Types.ObjectId().toString(),
        members: [{ _id: targetMemberId }],
      });

      const req: Partial<AuthRequest> = {
        params: { id: validTeamId, memberId: targetMemberId },
        user: { id: new Types.ObjectId().toString(), role: 'student' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await removeMemberController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(removeMember).not.toHaveBeenCalled();
    });

    it('rejects removal of the team leader', async () => {
      const leaderId = new Types.ObjectId().toString();
      const validTeamId = new Types.ObjectId().toString();
      getTeam.mockResolvedValueOnce({
        _id: validTeamId,
        leader: { _id: leaderId },
        members: [{ _id: leaderId }],
      });

      const req: Partial<AuthRequest> = {
        params: { id: validTeamId, memberId: leaderId },
        user: { id: leaderId, role: 'leader' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await removeMemberController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Cannot remove team leader. Transfer leadership first.',
      });
      expect(removeMember).not.toHaveBeenCalled();
    });

    it('rejects removal if target user is not a member of the team', async () => {
      const nonMemberId = new Types.ObjectId().toString();
      const leaderId = new Types.ObjectId().toString();
      const validTeamId = new Types.ObjectId().toString();
      getTeam.mockResolvedValueOnce({
        _id: validTeamId,
        leader: { _id: leaderId },
        members: [{ _id: leaderId }],
      });

      const req: Partial<AuthRequest> = {
        params: { id: validTeamId, memberId: nonMemberId },
        user: { id: leaderId, role: 'leader' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await removeMemberController(req as AuthRequest, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User is not a member of this team' });
    });

    it('allows a member to remove themselves (leave team)', async () => {
      const leavingMemberId = new Types.ObjectId().toString();
      const validTeamId = new Types.ObjectId().toString();
      getTeam.mockResolvedValueOnce({
        _id: validTeamId,
        leader: new Types.ObjectId().toString(),
        members: [{ _id: leavingMemberId }],
      });

      const req: Partial<AuthRequest> = {
        params: { id: validTeamId, memberId: leavingMemberId },
        user: { id: leavingMemberId, role: 'student' },
      };
      const res: Partial<any> = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await removeMemberController(req as AuthRequest, res as any);

      expect(removeMember).toHaveBeenCalledWith(validTeamId, expect.any(Types.ObjectId));
      expect(res.json).toHaveBeenCalled();
    });

    it('allows the team leader to remove an existing member', async () => {
      const leaderId = new Types.ObjectId().toString();
      const targetMemberId = new Types.ObjectId().toString();
      const validTeamId = new Types.ObjectId().toString();
      getTeam.mockResolvedValueOnce({
        _id: validTeamId,
        leader: { _id: leaderId },
        members: [{ _id: leaderId }, { _id: targetMemberId }],
      });

      const req: Partial<AuthRequest> = {
        params: { id: validTeamId, memberId: targetMemberId },
        user: { id: leaderId, role: 'leader' },
      };
      const res: Partial<any> = {
        json: jest.fn(),
      };

      await removeMemberController(req as AuthRequest, res as any);

      expect(removeMember).toHaveBeenCalledWith(validTeamId, expect.any(Types.ObjectId));
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('User Profile Route Security (PUT /api/users/me)', () => {
    const testUserId = new Types.ObjectId().toString();
    const token = jwt.sign({ id: testUserId, role: 'student' }, JWT_ACCESS_SECRET);

    it('returns 404 when authenticated user no longer exists', async () => {
      User.findById.mockResolvedValueOnce(null);

      const res = await request(testApp)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('returns 400 when malformed JSON string is passed for skills array', async () => {
      User.findById.mockResolvedValueOnce({ _id: testUserId, isDeleted: false });

      const res = await request(testApp)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ skills: '{not_valid_json' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('valid JSON array');
    });

    it('returns 400 when non-array is passed for array field', async () => {
      User.findById.mockResolvedValueOnce({ _id: testUserId, isDeleted: false });

      const res = await request(testApp)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ skills: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must be an array');
    });

    it('returns 400 when year is invalid or out of range', async () => {
      User.findById.mockResolvedValueOnce({ _id: testUserId, isDeleted: false });

      const res = await request(testApp)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ year: 'invalid-year' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('valid integer');
    });

    it('returns 400 when string field has non-string type', async () => {
      User.findById.mockResolvedValueOnce({ _id: testUserId, isDeleted: false });

      const res = await request(testApp)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ bio: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('must be a string');
    });

    it('prevents mass assignment of protected fields (role, email, isVerified, isDeleted)', async () => {
      User.findById.mockResolvedValueOnce({ _id: testUserId, isDeleted: false });
      User.findByIdAndUpdate.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ _id: testUserId, name: 'Legit Name' }),
      });

      const res = await request(testApp)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Legit Name',
          role: 'admin',
          email: 'hacked@evil.com',
          isVerified: true,
          isDeleted: true,
        });

      expect(res.status).toBe(200);
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        testUserId,
        { name: 'Legit Name' },
        { new: true }
      );
    });

    it('rejects avatar upload with invalid binary file signature (e.g. text/html named avatar.png)', async () => {
      const fakeImageBuffer = Buffer.from('<html><script>alert("hacked")</script></html>');

      const res = await request(testApp)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .attach('avatar', fakeImageBuffer, { filename: 'avatar.png', contentType: 'image/png' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid file signature');
    });

    it('accepts avatar upload with valid PNG binary magic bytes', async () => {
      User.findById.mockResolvedValueOnce({ _id: testUserId, isDeleted: false });
      User.findByIdAndUpdate.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue({ _id: testUserId, avatarUrl: '/uploads/avatar-test.png' }),
      });

      // Valid PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const validPngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D]);

      const res = await request(testApp)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .attach('avatar', validPngHeader, { filename: 'avatar.png', contentType: 'image/png' });

      expect(res.status).toBe(200);
    });
  });

  describe('Soft-Deletion Enforcement Suite', () => {
    const testUserId = new Types.ObjectId().toString();
    const token = jwt.sign({ id: testUserId, role: 'student' }, JWT_ACCESS_SECRET);

    it('rejects refreshAccessToken for soft-deleted accounts', async () => {
      User.findOne.mockResolvedValueOnce(null);

      await expect(refreshAccessToken('some_refresh_token')).rejects.toThrow('Invalid refresh token');
    });

    it('returns 404 on GET /api/users/me when user is soft-deleted', async () => {
      User.findOne.mockReturnValueOnce({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(testApp)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('rejects legacy login for soft-deleted accounts', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const res = await request(testApp)
        .post('/api/users/login')
        .send({ email: 'deleted@example.com', password: 'AnyPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('Invalid credentials');
    });

    it('returns 404 on DELETE /api/users/me when user is already soft-deleted', async () => {
      User.findById.mockResolvedValueOnce({ _id: testUserId, isDeleted: true });

      const res = await request(testApp)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('returns 404 on POST /api/users/logout-all when user is soft-deleted', async () => {
      User.findById.mockResolvedValueOnce({ _id: testUserId, isDeleted: true });

      const res = await request(testApp)
        .post('/api/users/logout-all')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    it('returns 403 on protected team routes when user account is soft-deleted via requireActiveUser', async () => {
      User.findOne.mockResolvedValueOnce(null);

      const res = await request(testApp)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hacked Team' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Account has been deactivated or deleted');
    });
  });

  describe('Password & Preferences Route Security', () => {
    const testUserId = new Types.ObjectId().toString();
    const token = jwt.sign({ id: testUserId, role: 'student' }, JWT_ACCESS_SECRET);

    describe('PUT /api/users/me/password', () => {
      it('returns 400 if currentPassword or newPassword is missing', async () => {
        const res = await request(testApp)
          .put('/api/users/me/password')
          .set('Authorization', `Bearer ${token}`)
          .send({ currentPassword: '' });

        expect(res.status).toBe(400);
      });

      it('returns 400 if newPassword fails complexity policy', async () => {
        const res = await request(testApp)
          .put('/api/users/me/password')
          .set('Authorization', `Bearer ${token}`)
          .send({ currentPassword: 'OldPassword123!', newPassword: 'weak' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Password must be at least 8 characters long');
      });

      it('returns 400 if currentPassword is incorrect', async () => {
        const hashedOld = await bcrypt.hash('CorrectOldPassword123!', 10);
        User.findById.mockResolvedValueOnce({
          _id: testUserId,
          isDeleted: false,
          password: hashedOld,
          save: jest.fn().mockResolvedValue(true),
        });

        const res = await request(testApp)
          .put('/api/users/me/password')
          .set('Authorization', `Bearer ${token}`)
          .send({ currentPassword: 'WrongOldPassword123!', newPassword: 'NewValidPassword123!' });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Incorrect current password');
      });

      it('updates password successfully with valid current and new password', async () => {
        const hashedOld = await bcrypt.hash('CorrectOldPassword123!', 10);
        const mockUser = {
          _id: testUserId,
          isDeleted: false,
          password: hashedOld,
          save: jest.fn().mockResolvedValue(true),
        };
        User.findById.mockResolvedValueOnce(mockUser);

        const res = await request(testApp)
          .put('/api/users/me/password')
          .set('Authorization', `Bearer ${token}`)
          .send({ currentPassword: 'CorrectOldPassword123!', newPassword: 'NewValidPassword123!' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Password updated successfully');
        expect(mockUser.save).toHaveBeenCalled();
      });
    });

    describe('PUT /api/users/me/preferences', () => {
      it('returns 400 if no preferences or notification settings are provided', async () => {
        const res = await request(testApp)
          .put('/api/users/me/preferences')
          .set('Authorization', `Bearer ${token}`)
          .send({});

        expect(res.status).toBe(400);
      });

      it('returns 400 if invalid/arbitrary preference keys are provided', async () => {
        User.findById.mockResolvedValueOnce({ _id: testUserId, isDeleted: false, preferences: {}, save: jest.fn() });

        const res = await request(testApp)
          .put('/api/users/me/preferences')
          .set('Authorization', `Bearer ${token}`)
          .send({ preferences: { isAdmin: 'true', hackedKey: 'value' } });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('Invalid preference setting');
      });

      it('returns 400 if notification setting has non-boolean value', async () => {
        User.findById.mockResolvedValueOnce({ _id: testUserId, isDeleted: false, notificationSettings: {}, save: jest.fn() });

        const res = await request(testApp)
          .put('/api/users/me/preferences')
          .set('Authorization', `Bearer ${token}`)
          .send({ notificationSettings: { emailNotifications: 'not-a-boolean' } });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('must be a boolean');
      });

      it('updates valid preferences and notification settings successfully', async () => {
        const mockUser = {
          _id: testUserId,
          isDeleted: false,
          preferences: {},
          notificationSettings: {},
          save: jest.fn().mockResolvedValue(true),
        };
        User.findById.mockResolvedValueOnce(mockUser);

        const res = await request(testApp)
          .put('/api/users/me/preferences')
          .set('Authorization', `Bearer ${token}`)
          .send({
            preferences: { theme: 'dark', language: 'en' },
            notificationSettings: { emailNotifications: false, pushNotifications: true },
          });

        expect(res.status).toBe(200);
        expect(res.body.data.preferences.theme).toBe('dark');
        expect(res.body.data.notificationSettings.emailNotifications).toBe(false);
        expect(mockUser.save).toHaveBeenCalled();
      });
    });
  });

  describe('Team Route Validation & Middleware Order (validateExpress)', () => {
    const testUserId = new Types.ObjectId().toString();
    const token = jwt.sign({ id: testUserId, role: 'leader' }, JWT_ACCESS_SECRET);

    it('returns 400 Validation failed and does not reach controller when createTeam payload is invalid', async () => {
      User.findOne.mockResolvedValueOnce({ _id: testUserId, isDeleted: false });

      const res = await request(testApp)
        .post('/api/teams')
        .set('Authorization', `Bearer ${token}`)
        .send({}); // Missing name, hackathon, maxMembers

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.length).toBeGreaterThan(0);
      expect(createTeam).not.toHaveBeenCalled();
    });

    it('returns 400 Validation failed and does not reach controller when updateTeam payload is invalid', async () => {
      User.findOne.mockResolvedValueOnce({ _id: testUserId, isDeleted: false });
      const validTeamId = new Types.ObjectId().toString();

      const res = await request(testApp)
        .put(`/api/teams/${validTeamId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ maxMembers: -5 }); // Invalid maxMembers (< 1)

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validation failed');
      expect(updateTeam).not.toHaveBeenCalled();
    });
  });
});
