import { Team, ITeam } from '../models/Team';
import { Types } from 'mongoose';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { Hackathon } from '../models/Hackathon';
import { TeamMessage } from '../models/TeamMessage';
import { getIo } from '../socket/socketServer';

/** Service for Team CRUD, search, management */
export const createTeam = async (data: Partial<ITeam>, leaderId: Types.ObjectId) => {
  if (data.hackathon) {
    const existsInInternal = await Hackathon.exists({ _id: data.hackathon });
    const existsInExternal = await ExternalHackathon.exists({ _id: data.hackathon });
    if (!existsInInternal && !existsInExternal) {
      throw new Error('Target hackathon record not found in MongoDB');
    }
  }

  const maxMembers = data.maxMembers && data.maxMembers > 0 ? data.maxMembers : 4;
  const team = new Team({
    ...data,
    leader: leaderId,
    members: [leaderId],
    maxMembers,
    status: data.status || 'Open',
  });
  return await team.save();
};

export const getTeam = async (id: string) => {
  const team = await Team.findById(id).populate('leader members hackathon').lean();
  if (team && !team.hackathon) {
    const rawTeam = await Team.findById(id).lean();
    if (rawTeam && rawTeam.hackathon) {
      const extObj = await ExternalHackathon.findById(rawTeam.hackathon).lean();
      if (extObj) {
        (team as any).hackathon = {
          ...extObj,
          bannerImagePath: extObj.image || (extObj as any).bannerImagePath,
          officialWebsite: extObj.officialUrl || (extObj as any).officialWebsite,
          source: 'external',
        };
      }
    }
  }
  return team;
};

export const updateTeam = async (id: string, updates: Partial<ITeam>) => {
  return await Team.findByIdAndUpdate(id, updates, { new: true }).lean();
};

export const deleteTeam = async (id: string) => {
  return await Team.findByIdAndDelete(id).lean();
};

export const archiveTeam = async (id: string) => {
  return await Team.findByIdAndUpdate(id, { status: 'Archived' }, { new: true }).lean();
};

export const reopenTeam = async (id: string) => {
  return await Team.findByIdAndUpdate(id, { status: 'Open' }, { new: true }).lean();
};

export const transferLeadership = async (teamId: string, newLeaderId: Types.ObjectId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new Error('Team not found');
  team.leader = newLeaderId;
  if (!team.members.some(m => m.equals(newLeaderId))) {
    team.members.push(newLeaderId);
  }
  return await team.save();
};

export const removeMember = async (teamId: string, memberId: Types.ObjectId) => {
  const team = await Team.findById(teamId);
  if (!team) throw new Error('Team not found');
  if (team.leader.equals(memberId)) {
    throw new Error('Cannot remove team leader. Transfer leadership first.');
  }
  team.members = team.members.filter(m => !m.equals(memberId));
  if (team.status === 'Full' && team.members.length < team.maxMembers) {
    team.status = 'Open';
  }
  return await team.save();
};

export const getTeamMessages = async (teamId: string, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const messages = await TeamMessage.find({ team: teamId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name email profilePicture');
  
  return messages.reverse(); // Return in chronological order
};

export const searchTeams = async (options: {
  q?: string;
  leader?: string;
  requiredSkills?: string[];
  openRoles?: string[];
  status?: string;
  hackathonId?: string;
  sortBy?: 'latest' | 'active' | 'openPositions';
  page?: number;
  limit?: number;
}) => {
  const {
    q, leader, requiredSkills, openRoles, status, hackathonId,
    sortBy = 'latest', page = 1, limit = 12,
  } = options;

  const filter: any = {};
  if (q && q.trim()) {
    const safeRegex = new RegExp(q.trim(), 'i');
    filter.$or = [
      { name: safeRegex },
      { description: safeRegex },
      { requiredSkills: { $in: [safeRegex] } },
      { openRoles: { $in: [safeRegex] } }
    ];
  }
  if (leader) filter.leader = leader;
  if (requiredSkills?.length) filter.requiredSkills = { $all: requiredSkills };
  if (openRoles?.length) filter.openRoles = { $all: openRoles };
  if (status) filter.status = status;
  if (hackathonId) filter.hackathon = hackathonId;

  const sort: any = {};
  switch (sortBy) {
    case 'active':
      sort.updatedAt = -1; break;
    case 'openPositions':
      sort.maxMembers = -1; break;
    case 'latest':
    default:
      sort.createdAt = -1; break;
  }

  const total = await Team.countDocuments(filter);
  const items = await Team.find(filter)
    .populate('leader hackathon')
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return { total, page, limit, items };
};

export const sendSystemMessage = async (teamId: string, text: string) => {
  try {
    const newMessage = new TeamMessage({
      team: teamId,
      message: text,
      messageType: 'system',
    });
    await newMessage.save();

    const io = getIo();
    io.to(`team:${teamId}`).emit('receive_message', newMessage);
  } catch (err) {
    console.error('Failed to send system message:', err);
  }
};
