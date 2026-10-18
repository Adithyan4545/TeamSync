import { TeamExitRequest } from '../models/TeamExitRequest';
import { Team } from '../models/Team';
import { User } from '../models/User';
import { Types } from 'mongoose';
import { createNotification } from './notificationService';
import { sendSystemMessage } from './teamService';

/**
 * Create a team exit request for an active team member.
 */
export const createExitRequest = async (
  memberId: Types.ObjectId,
  teamId: Types.ObjectId,
  reason?: string
) => {
  const team = await Team.findById(teamId);
  if (!team) throw new Error('Team not found');

  if (team.status === 'Closed' || team.status === 'Archived') {
    throw new Error('Exit requests cannot be created for closed or archived teams');
  }

  if (team.leader.equals(memberId)) {
    throw new Error('Team leader cannot request to leave using normal member exit flow. Transfer leadership first.');
  }

  const isMember = team.members.some((m) => m.equals(memberId));
  if (!isMember) {
    throw new Error('User is not a member of this team');
  }

  const existingPending = await TeamExitRequest.findOne({
    team: teamId,
    member: memberId,
    status: 'Pending',
  }).lean();

  if (existingPending) {
    throw new Error('You already have a pending exit request for this team');
  }

  const memberUser = await User.findById(memberId).lean();
  let roleAtExit = 'Backend Developer';

  if (memberUser?.skills && memberUser.skills.length > 0) {
    const sLower = memberUser.skills.join(' ').toLowerCase();
    if (sLower.includes('react') || sLower.includes('frontend') || sLower.includes('ui')) roleAtExit = 'Frontend Developer';
    else if (sLower.includes('python') || sLower.includes('node') || sLower.includes('backend') || sLower.includes('fastapi')) roleAtExit = 'Backend Developer';
    else if (sLower.includes('ai') || sLower.includes('ml') || sLower.includes('torch')) roleAtExit = 'ML Developer';
    else if (sLower.includes('figma') || sLower.includes('design')) roleAtExit = 'UI/UX Designer';
  } else if (team.openRoles && team.openRoles.length > 0) {
    roleAtExit = team.openRoles[0];
  }

  const skillsAtExit = memberUser?.skills && memberUser.skills.length > 0
    ? memberUser.skills
    : (team.requiredSkills || ['Python', 'FastAPI', 'MongoDB']);

  const exitReq = new TeamExitRequest({
    team: teamId,
    member: memberId,
    roleAtExit,
    skillsAtExit,
    reason: reason || 'Leaving team',
    status: 'Pending',
  });

  const saved = await exitReq.save();

  // Notify team leader
  await createNotification(team.leader, 'MemberExitRequested', {
    teamId,
    memberId,
    requestId: saved._id,
    message: `${memberUser?.name || 'A team member'} has requested to leave your team: ${team.name}`,
  });

  return saved;
};

/**
 * Cancel a pending exit request by the member.
 */
export const cancelExitRequest = async (requestId: string, memberId: Types.ObjectId) => {
  const exitReq = await TeamExitRequest.findById(requestId);
  if (!exitReq) throw new Error('Exit request not found');

  if (!exitReq.member.equals(memberId)) {
    throw new Error('Unauthorized to cancel this exit request');
  }

  if (exitReq.status !== 'Pending') {
    throw new Error('Only pending exit requests can be cancelled');
  }

  exitReq.status = 'Cancelled';
  return await exitReq.save();
};

/**
 * Leader approves a member's exit request:
 * 1. Removes member from team.members.
 * 2. Updates team status from Full -> Open if applicable.
 * 3. Automatically opens replacement role based on member's role and skills.
 * 4. Notifies member and team.
 */
export const approveExitRequest = async (requestId: string, leaderId: Types.ObjectId) => {
  const exitReq = await TeamExitRequest.findById(requestId);
  if (!exitReq) throw new Error('Exit request not found');

  if (exitReq.status !== 'Pending') {
    throw new Error('Only pending exit requests can be approved');
  }

  const team = await Team.findById(exitReq.team);
  if (!team) throw new Error('Team not found');

  if (!team.leader.equals(leaderId)) {
    throw new Error('Only the team leader can approve exit requests');
  }

  const memberId = exitReq.member;
  const isMember = team.members.some((m) => m.equals(memberId));
  if (!isMember) {
    throw new Error('Member is no longer in this team');
  }

  // 1. Remove member from team.members
  team.members = team.members.filter((m) => !m.equals(memberId));

  // 2. Team status Full -> Open
  if (team.members.length < team.maxMembers) {
    team.status = 'Open';
  }

  // 3. Dynamic Replacement Role creation
  const roleName = exitReq.roleAtExit || 'Backend Developer';
  const openRolesSet = new Set(team.openRoles || []);
  openRolesSet.add(roleName);
  team.openRoles = Array.from(openRolesSet);

  if (exitReq.skillsAtExit && exitReq.skillsAtExit.length > 0) {
    const requiredSet = new Set([...(team.requiredSkills || []), ...exitReq.skillsAtExit]);
    team.requiredSkills = Array.from(requiredSet);
  }

  await team.save();

  const userModel = (await import('../models/User')).User;
  const leavingUser = await userModel.findById(memberId).lean();
  if (leavingUser) {
    await sendSystemMessage(team._id.toString(), `🚪 ${leavingUser.name} left the team.`);
  }

  // 4. Update exit request
  exitReq.status = 'Approved';
  exitReq.reviewedBy = leaderId;
  exitReq.reviewedAt = new Date();
  const savedReq = await exitReq.save();

  // 5. Notifications
  await createNotification(memberId, 'MemberExitApproved', {
    teamId: team._id,
    requestId: savedReq._id,
    message: `Your request to leave team "${team.name}" has been approved by the team leader.`,
  });

  // Notify remaining team members about opened replacement role
  for (const remainingMemberId of team.members) {
    if (!remainingMemberId.equals(leaderId)) {
      await createNotification(remainingMemberId, 'ReplacementRoleOpened', {
        teamId: team._id,
        role: roleName,
        message: `A ${roleName} position is now open in team "${team.name}".`,
      });
    }
  }

  return savedReq;
};

/**
 * Leader rejects a member's exit request:
 * Member remains in team, request status becomes Rejected.
 */
export const rejectExitRequest = async (requestId: string, leaderId: Types.ObjectId) => {
  const exitReq = await TeamExitRequest.findById(requestId);
  if (!exitReq) throw new Error('Exit request not found');

  if (exitReq.status !== 'Pending') {
    throw new Error('Only pending exit requests can be rejected');
  }

  const team = await Team.findById(exitReq.team);
  if (!team) throw new Error('Team not found');

  if (!team.leader.equals(leaderId)) {
    throw new Error('Only the team leader can reject exit requests');
  }

  exitReq.status = 'Rejected';
  exitReq.reviewedBy = leaderId;
  exitReq.reviewedAt = new Date();
  const savedReq = await exitReq.save();

  // Notify member
  await createNotification(exitReq.member, 'MemberExitRejected', {
    teamId: team._id,
    requestId: savedReq._id,
    message: `Your request to leave team "${team.name}" was rejected by the team leader.`,
  });

  return savedReq;
};

/**
 * List exit requests for a specific team.
 */
export const listExitRequestsForTeam = async (teamId: string, userId: Types.ObjectId) => {
  const team = await Team.findById(teamId).lean();
  if (!team) throw new Error('Team not found');

  const isLeader = team.leader.toString() === userId.toString();
  const isMember = team.members.some((m) => m.toString() === userId.toString());

  if (!isLeader && !isMember) {
    throw new Error('Unauthorized to view exit requests for this team');
  }

  return await TeamExitRequest.find({ team: teamId })
    .populate('member team reviewedBy')
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * List all exit requests submitted by a user.
 */
export const getUserExitRequests = async (userId: Types.ObjectId) => {
  return await TeamExitRequest.find({ member: userId })
    .populate('team reviewedBy')
    .sort({ createdAt: -1 })
    .lean();
};
