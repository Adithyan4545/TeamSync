import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  createHackathon,
  getHackathon,
  updateHackathon,
  deleteHackathon,
  searchHackathons,
  getHackathonStats,
  getLocationOptionsService,
} from '../services/hackathonService';
import { addHackathonBookmark, removeHackathonBookmark, listUserBookmarks } from '../services/bookmarkService';
import { validationResult } from 'express-validator';
import { Types } from 'mongoose';

// Helper to extract validation errors
export const handleValidation = (req: AuthRequest, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const createHackathonController = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = new Types.ObjectId(req.user!.id);
    const hackathon = await createHackathon(req.body, adminId);
    res.status(201).json(hackathon);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getHackathonController = async (req: AuthRequest, res: Response) => {
  try {
    const hackathon = await getHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });
    res.json(hackathon);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateHackathonController = async (req: AuthRequest, res: Response) => {
  try {
    const hackathon = await updateHackathon(req.params.id, req.body);
    if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });
    res.json(hackathon);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteHackathonController = async (req: AuthRequest, res: Response) => {
  try {
    const hackathon = await deleteHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ error: 'Hackathon not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const searchHackathonsController = async (req: AuthRequest, res: Response) => {
  try {
    const result = await searchHackathons({
      q: req.query.q as string,
      theme: req.query.theme as string,
      difficulty: req.query.difficulty as string,
      mode: req.query.mode as string,
      status: req.query.status as string,
      source: req.query.source as any,
      sourceProvider: req.query.sourceProvider as string,
      sourceType: req.query.sourceType as string,
      upcomingWindow: req.query.upcomingWindow as any,
      registrationFee: req.query.registrationFee as any,
      eligibility: req.query.eligibility as any,
      domain: req.query.domain as any,
      state: req.query.state as string,
      city: req.query.city as string,
      country: req.query.country as string,
      minPrize: req.query.minPrize ? Number(req.query.minPrize) : undefined,
      maxPrize: req.query.maxPrize ? Number(req.query.maxPrize) : undefined,
      minTeamSize: req.query.minTeamSize ? Number(req.query.minTeamSize) : undefined,
      maxTeamSize: req.query.maxTeamSize ? Number(req.query.maxTeamSize) : undefined,
      requiredSkills: req.query.requiredSkills ? (req.query.requiredSkills as string).split(',') : undefined,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      sortBy: req.query.sortBy as any,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      userId: req.user?.id || (req.user as any)?._id ? String(req.user?.id || (req.user as any)?._id) : undefined,
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getLocationOptionsController = async (req: AuthRequest, res: Response) => {
  try {
    const locationOptions = await getLocationOptionsService();
    res.json({ success: true, ...locationOptions });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getHackathonStatsController = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await getHackathonStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const syncHackathonsController = async (req: AuthRequest, res: Response) => {
  try {
    const { syncExternalHackathons } = await import('../services/externalHackathonService');
    const result = await syncExternalHackathons();
    res.json({ success: true, message: 'External hackathons synchronized successfully', data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
};

export const bookmarkHackathonController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const hackathonId = new Types.ObjectId(req.params.id);
    await addHackathonBookmark(userId, hackathonId);
    res.json({ message: 'Bookmarked' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const unbookmarkHackathonController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const hackathonId = new Types.ObjectId(req.params.id);
    await removeHackathonBookmark(userId, hackathonId);
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

export const getSyncStatusController = async (req: AuthRequest, res: Response) => {
  try {
    const { SyncAudit } = await import('../models/SyncAudit');
    const latestSync = await SyncAudit.findOne().sort({ syncCompletedAt: -1 });

    if (!latestSync) {
      return res.json({ message: 'No sync history found.' });
    }

    const nextSyncTime = new Date(latestSync.syncCompletedAt.getTime() + 3 * 60 * 60 * 1000);

    res.json({
      lastSync: latestSync.syncCompletedAt,
      nextSync: nextSyncTime,
      totalActive: latestSync.totalActiveHackathons,
      newRecords: latestSync.newRecords,
      updatedRecords: latestSync.updatedRecords,
      duplicatesPrevented: latestSync.duplicatesPrevented,
      next35DayCount: latestSync.next35DayCount,
      target: latestSync.targetActiveHackathons,
      targetReached: latestSync.targetReached,
      providerStatus: latestSync.providerStatus,
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
