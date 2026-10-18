import { TeamRequest } from '../models/TeamRequest';
import { Team } from '../models/Team';
import { Types } from 'mongoose';
import { createNotification } from './notificationService';
import { sendSystemMessage } from './teamService';

/** Service handling join request lifecycle */
export const sendJoinRequest = async (userId: Types.ObjectId, teamId: Types.ObjectId, message?: string) => {
  const team = await Team.findById(teamId).lean();
  if (!team) throw new Error('Team not found');

  if (team.leader?.toString() === userId.toString()) {
    throw new Error('You are the leader of this team');
  }
  if (team.members.some((m) => m.toString() === userId.toString())) {
    throw new Error('User is already a member of this team');
  }
  if (team.status === 'Closed' || team.status === 'Archived') {
    throw new Error('Team is closed for new join requests');
  }
  if (team.status === 'Full' || team.members.length >= team.maxMembers) {
    throw new Error('Team is full');
  }

  const existing = await TeamRequest.findOne({ user: userId, team: teamId }).lean();
  if (existing) throw new Error('Join request already exists');

  const request = new TeamRequest({ user: userId, team: teamId, message });
  const saved = await request.save();

  if (team?.leader) {
    const userModel = (await import('../models/User')).User;
    const requestingUser = await userModel.findById(userId).lean();

    await createNotification(team.leader as Types.ObjectId, 'JoinRequestSent', {
      teamId,
      userId,
      requestId: saved._id,
      message: `${requestingUser?.name || 'A user'} has requested to join your team: ${team.name}`,
      userEmail: requestingUser?.email,
      userGithub: requestingUser?.github,
      userLinkedin: requestingUser?.linkedin,
      userPortfolio: requestingUser?.portfolio,
    });
  }
  return saved;
};

export const withdrawJoinRequest = async (userId: Types.ObjectId, teamId: Types.ObjectId) => {
  const result = await TeamRequest.findOneAndUpdate(
    { user: userId, team: teamId },
    { status: 'Withdrawn' },
    { new: true }
  ).lean();
  return result;
};

export const cancelJoinRequest = async (userId: Types.ObjectId, teamId: Types.ObjectId) => {
  return await TeamRequest.findOneAndDelete({ user: userId, team: teamId }).lean();
};

export const editJoinRequestMessage = async (userId: Types.ObjectId, teamId: Types.ObjectId, message: string) => {
  return await TeamRequest.findOneAndUpdate(
    { user: userId, team: teamId, status: 'Pending' },
    { message },
    { new: true }
  ).lean();
};

export const updateJoinRequestStatus = async (
  requestId: string,
  status: 'Accepted' | 'Rejected' | 'Shortlisted' | 'Cancelled'
) => {
  if (!Types.ObjectId.isValid(requestId)) {
    return null;
  }

  const existingReq = await TeamRequest.findById(requestId).lean();
  if (!existingReq) throw new Error('Join request not found');

  if (status === 'Accepted') {
    const team = await Team.findById(existingReq.team);
    if (!team) throw new Error('Team not found');

    if (team.status === 'Closed' || team.status === 'Archived') {
      throw new Error('Team is closed for new members');
    }
    if (team.members.length >= team.maxMembers) {
      team.status = 'Full';
      await team.save();
      throw new Error('Team is already full');
    }

    if (!team.members.some((m) => m.equals(existingReq.user))) {
      team.members.push(existingReq.user as Types.ObjectId);
      if (team.members.length >= team.maxMembers) {
        team.status = 'Full';
      }
      await team.save();

      // Broadcast system message
      const userModel = (await import('../models/User')).User;
      const joinedUser = await userModel.findById(existingReq.user).lean();
      if (joinedUser) {
        await sendSystemMessage(team._id.toString(), `👋 ${joinedUser.name} joined the team.`);
      }
    }
  }

  const updated = await TeamRequest.findByIdAndUpdate(
    requestId,
    { status },
    { new: true }
  ).lean();

  if (updated) {
    await createNotification(
      updated.user as Types.ObjectId,
      status === 'Accepted' ? 'JoinRequestAccepted' : 'JoinRequestRejected',
      { teamId: updated.team, requestId: updated._id }
    );
  }
  return updated;
};

export const bulkUpdateJoinRequestStatus = async (
  requestIds: string[],
  status: 'Accepted' | 'Rejected'
) => {
  const results = await Promise.all(
    requestIds.map((id) => updateJoinRequestStatus(id, status))
  );
  return results;
};

export const listTeamRequestsForLeader = async (leaderId: Types.ObjectId) => {
  const teams = await Team.find({ leader: leaderId }).select('_id').lean();
  const teamIds = teams.map((t) => t._id);
  return await TeamRequest.find({ team: { $in: teamIds } })
    .populate('user team')
    .lean();
};

export const listUserJoinRequests = async (userId: Types.ObjectId) => {
  return await TeamRequest.find({ user: userId })
    .populate('team')
    .lean();
};
