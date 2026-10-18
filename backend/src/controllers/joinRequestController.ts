import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  sendJoinRequest,
  cancelJoinRequest,
  withdrawJoinRequest,
  editJoinRequestMessage,
  updateJoinRequestStatus,
  bulkUpdateJoinRequestStatus,
  listTeamRequestsForLeader,
  listUserJoinRequests,
} from '../services/joinRequestService';
import { Types } from 'mongoose';

export const sendJoinRequestController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const { teamId, message } = req.body;
    if (!teamId) {
      return res.status(400).json({ error: 'teamId is required' });
    }
    const request = await sendJoinRequest(userId, new Types.ObjectId(teamId), message);
    res.status(201).json(request);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to send join request' });
  }
};

export const withdrawJoinRequestController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const { teamId } = req.params;
    const result = await withdrawJoinRequest(userId, new Types.ObjectId(teamId));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelJoinRequestController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const { teamId } = req.params;
    const result = await cancelJoinRequest(userId, new Types.ObjectId(teamId));
    if (!result) {
      return res.status(404).json({ error: 'Join request not found' });
    }
    res.json({ message: 'Join request cancelled' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const editJoinRequestMessageController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const { teamId } = req.params;
    const { message } = req.body;
    const result = await editJoinRequestMessage(userId, new Types.ObjectId(teamId), message);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateJoinRequestStatusController = async (req: AuthRequest, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;
    if (!['Accepted', 'Rejected', 'Shortlisted', 'Cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updated = await updateJoinRequestStatus(requestId, status);
    if (!updated) {
      return res.status(404).json({ error: 'Join request not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const bulkUpdateJoinRequestStatusController = async (req: AuthRequest, res: Response) => {
  try {
    const { requestIds, status } = req.body;
    if (!Array.isArray(requestIds) || !['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid requestIds or status' });
    }
    const results = await bulkUpdateJoinRequestStatus(requestIds, status);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getLeaderTeamRequestsController = async (req: AuthRequest, res: Response) => {
  try {
    const leaderId = new Types.ObjectId(req.user!.id);
    const requests = await listTeamRequestsForLeader(leaderId);
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getUserJoinRequestsController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const requests = await listUserJoinRequests(userId);
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
