import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  addHackathonBookmark,
  removeHackathonBookmark,
  deleteBookmarkById,
  addTeamBookmark,
  removeTeamBookmark,
  listUserBookmarks,
} from '../services/bookmarkService';
import { Types } from 'mongoose';

export const bookmarkHackathonController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const hackathonIdStr = req.params.id || req.body.hackathonId;
    if (!hackathonIdStr || !Types.ObjectId.isValid(hackathonIdStr)) {
      return res.status(400).json({ error: 'Invalid hackathon ID' });
    }
    const hackathonId = new Types.ObjectId(hackathonIdStr);
    const bookmark = await addHackathonBookmark(userId, hackathonId);
    res.status(201).json(bookmark);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const unbookmarkHackathonController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const targetId = req.params.id;

    if (!targetId || !Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    // Attempt delete by bookmark ID first
    try {
      const deletedById = await deleteBookmarkById(targetId, userId);
      if (deletedById) {
        return res.json({ message: 'Bookmark removed' });
      }
    } catch (err: any) {
      if (err.message === "Unauthorized access to another user's bookmark") {
        return res.status(403).json({ error: err.message });
      }
    }

    // Fallback: delete by user + hackathon ID
    const hackathonId = new Types.ObjectId(targetId);
    const deletedByHackathon = await removeHackathonBookmark(new Types.ObjectId(userId), hackathonId);
    if (!deletedByHackathon) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    res.json({ message: 'Hackathon bookmark removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const bookmarkTeamController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const teamId = new Types.ObjectId(req.params.id);
    const bookmark = await addTeamBookmark(userId, teamId);
    res.status(201).json(bookmark);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const unbookmarkTeamController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const teamId = new Types.ObjectId(req.params.id);
    await removeTeamBookmark(userId, teamId);
    res.json({ message: 'Team bookmark removed' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const listBookmarksController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const bookmarks = await listUserBookmarks(userId);
    res.json(bookmarks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
