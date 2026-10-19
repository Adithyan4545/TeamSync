import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  createTeam, getTeam, updateTeam, deleteTeam, searchTeams,
  archiveTeam, reopenTeam, transferLeadership, removeMember, getTeamMessages
} from '../services/teamService';
import { addTeamBookmark, removeTeamBookmark, listUserBookmarks } from '../services/bookmarkService';
import { Types } from 'mongoose';
import { User } from '../models/User';

export const createTeamController = async (req: AuthRequest, res: Response) => {
  try {
    const leaderId = new Types.ObjectId(req.user!.id);
    const team = await createTeam(req.body, leaderId);
    res.status(201).json(team);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getTeamController = async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }
    const team = await getTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

const isTeamLeaderOrAdmin = (team: any, userId: string, role?: string): boolean => {
  if (role === 'admin' || role === 'Admin') return true;
  const leaderIdStr = team.leader?._id ? team.leader._id.toString() : team.leader?.toString();
  return leaderIdStr === userId;
};

const ALLOWED_TEAM_UPDATE_FIELDS = [
  'name',
  'description',
  'maxMembers',
  'requiredSkills',
  'preferredSkills',
  'openRoles',
  'projectIdea',
  'recruitmentDeadline',
  'communicationPlatform',
  'visibility',
  'status',
];

const FORBIDDEN_TEAM_UPDATE_FIELDS = [
  'leader',
  'members',
  'hackathon',
  '_id',
  'id',
  'aiMatchScore',
  'compatibilityScore',
  'createdAt',
  'updatedAt',
  '__v',
];

export const updateTeamController = async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }
    const team = await getTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const userId = req.user!.id;
    if (!isTeamLeaderOrAdmin(team, userId, req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden: Only the team leader or an admin can update this team' });
    }

    const bodyKeys = Object.keys(req.body || {});
    const attemptedForbidden = bodyKeys.filter(key => FORBIDDEN_TEAM_UPDATE_FIELDS.includes(key));
    if (attemptedForbidden.length > 0) {
      return res.status(400).json({
        error: `Cannot modify protected team fields: ${attemptedForbidden.join(', ')}`,
      });
    }

    const updates: Record<string, any> = {};
    for (const field of ALLOWED_TEAM_UPDATE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid editable fields provided' });
    }

    const updated = await updateTeam(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteTeamController = async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }
    const team = await getTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const userId = req.user!.id;
    if (!isTeamLeaderOrAdmin(team, userId, req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden: Only the team leader or an admin can delete this team' });
    }

    await deleteTeam(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const archiveTeamController = async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }
    const team = await getTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const userId = req.user!.id;
    if (!isTeamLeaderOrAdmin(team, userId, req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden: Only the team leader or an admin can archive this team' });
    }

    const updated = await archiveTeam(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const reopenTeamController = async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }
    const team = await getTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const userId = req.user!.id;
    if (!isTeamLeaderOrAdmin(team, userId, req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden: Only the team leader or an admin can reopen this team' });
    }

    const updated = await reopenTeam(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const transferLeadershipController = async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }
    const { newLeaderId } = req.body;
    if (!newLeaderId || typeof newLeaderId !== 'string' || !Types.ObjectId.isValid(newLeaderId)) {
      return res.status(400).json({ error: 'A valid newLeaderId is required' });
    }

    const team = await getTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const userId = req.user!.id;
    if (!isTeamLeaderOrAdmin(team, userId, req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden: Only the team leader or an admin can transfer leadership' });
    }

    const currentLeaderId = team.leader?._id ? team.leader._id.toString() : team.leader?.toString();
    if (currentLeaderId === newLeaderId) {
      return res.status(400).json({ error: 'Target user is already the team leader' });
    }

    const targetUser = await User.findById(newLeaderId);
    if (!targetUser || targetUser.isDeleted) {
      return res.status(404).json({ error: 'Target user not found or inactive' });
    }

    const isMember = (team.members || []).some((m: any) => {
      const mId = m?._id ? m._id.toString() : m?.toString();
      return mId === newLeaderId;
    });

    if (!isMember) {
      return res.status(400).json({ error: 'Target user must already be a member of the team to become leader' });
    }

    const updated = await transferLeadership(req.params.id, new Types.ObjectId(newLeaderId));
    res.json(updated);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('must be a member') || msg.includes('not found')) {
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: msg });
  }
};

export const removeMemberController = async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }
    const { memberId } = req.params;
    if (!memberId || typeof memberId !== 'string' || !Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ error: 'A valid memberId is required' });
    }

    const team = await getTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const leaderIdStr = team.leader?._id ? team.leader._id.toString() : team.leader?.toString();
    const userId = req.user!.id;
    const isSelf = memberId === userId;
    if (!isSelf && !isTeamLeaderOrAdmin(team, userId, req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden: Only the team leader or the member themselves can perform this action' });
    }

    if (leaderIdStr === memberId) {
      return res.status(400).json({ error: 'Cannot remove team leader. Transfer leadership first.' });
    }

    const isMember = (team.members || []).some((m: any) => {
      const mId = m?._id ? m._id.toString() : m?.toString();
      return mId === memberId;
    });

    if (!isMember) {
      return res.status(400).json({ error: 'User is not a member of this team' });
    }

    const updated = await removeMember(req.params.id, new Types.ObjectId(memberId));
    res.json(updated);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Cannot remove team leader') || msg.includes('not a member') || msg.includes('not found')) {
      return res.status(400).json({ error: msg });
    }
    res.status(500).json({ error: msg });
  }
};

export const searchTeamsController = async (req: AuthRequest, res: Response) => {
  try {
    const result = await searchTeams({
      q: req.query.q as string,
      leader: req.query.leader as string,
      requiredSkills: req.query.requiredSkills ? (req.query.requiredSkills as string).split(',') : undefined,
      openRoles: req.query.openRoles ? (req.query.openRoles as string).split(',') : undefined,
      status: req.query.status as string,
      hackathonId: req.query.hackathonId as string,
      sortBy: req.query.sortBy as any,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const bookmarkTeamController = async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }
    const userId = new Types.ObjectId(req.user!.id);
    const teamId = new Types.ObjectId(req.params.id);
    await addTeamBookmark(userId, teamId);
    res.json({ message: 'Team bookmarked' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const unbookmarkTeamController = async (req: AuthRequest, res: Response) => {
  try {
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }
    const userId = new Types.ObjectId(req.user!.id);
    const teamId = new Types.ObjectId(req.params.id);
    await removeTeamBookmark(userId, teamId);
    res.json({ message: 'Bookmark removed' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const listBookmarksController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const bookmarks = await listUserBookmarks(userId);
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getTeamMessagesController = async (req: AuthRequest, res: Response) => {
  try {
    const teamId = req.params.id;
    if (!Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID format' });
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const team = await getTeam(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Verify membership
    const userId = req.user!.id;
    const isMember = team.leader._id.toString() === userId || team.members.some(m => m._id.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Forbidden: You are not a member of this team' });
    }

    const messages = await getTeamMessages(teamId, page, limit);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
