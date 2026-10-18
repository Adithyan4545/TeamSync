import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Types } from 'mongoose';
import {
  createExitRequest,
  cancelExitRequest,
  approveExitRequest,
  rejectExitRequest,
  listExitRequestsForTeam,
  getUserExitRequests,
} from '../services/teamExitService';

export const createExitRequestController = async (req: AuthRequest, res: Response) => {
  try {
    const memberId = new Types.ObjectId(req.user!.id);
    const { teamId, reason } = req.body;
    if (!teamId) {
      return res.status(400).json({ error: 'teamId is required' });
    }
    const result = await createExitRequest(memberId, new Types.ObjectId(teamId), reason);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const cancelExitRequestController = async (req: AuthRequest, res: Response) => {
  try {
    const memberId = new Types.ObjectId(req.user!.id);
    const { requestId } = req.params;
    const result = await cancelExitRequest(requestId, memberId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const approveExitRequestController = async (req: AuthRequest, res: Response) => {
  try {
    const leaderId = new Types.ObjectId(req.user!.id);
    const { requestId } = req.params;
    const result = await approveExitRequest(requestId, leaderId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const rejectExitRequestController = async (req: AuthRequest, res: Response) => {
  try {
    const leaderId = new Types.ObjectId(req.user!.id);
    const { requestId } = req.params;
    const result = await rejectExitRequest(requestId, leaderId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getTeamExitRequestsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const { teamId } = req.params;
    const results = await listExitRequestsForTeam(teamId, userId);
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getUserExitRequestsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const results = await getUserExitRequests(userId);
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};
