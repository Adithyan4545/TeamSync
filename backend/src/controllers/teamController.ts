import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  createTeam, getTeam, updateTeam, deleteTeam, searchTeams,
  archiveTeam, reopenTeam, transferLeadership, removeMember, getTeamMessages
} from '../services/teamService';
import { addTeamBookmark, removeTeamBookmark, listUserBookmarks } from '../services/bookmarkService';
import { Types } from 'mongoose';

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
    const team = await getTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateTeamController = async (req: AuthRequest, res: Response) => {
  try {
    const team = await updateTeam(req.params.id, req.body);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteTeamController = async (req: AuthRequest, res: Response) => {
  try {
    const team = await deleteTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const archiveTeamController = async (req: AuthRequest, res: Response) => {
  try {
    const team = await archiveTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const reopenTeamController = async (req: AuthRequest, res: Response) => {
  try {
    const team = await reopenTeam(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const transferLeadershipController = async (req: AuthRequest, res: Response) => {
  try {
    const { newLeaderId } = req.body;
    if (!newLeaderId) return res.status(400).json({ error: 'newLeaderId is required' });
    const team = await transferLeadership(req.params.id, new Types.ObjectId(newLeaderId));
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const removeMemberController = async (req: AuthRequest, res: Response) => {
  try {
    const { memberId } = req.params;
    const team = await removeMember(req.params.id, new Types.ObjectId(memberId));
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
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
