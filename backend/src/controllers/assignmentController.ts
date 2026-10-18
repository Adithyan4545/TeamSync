import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import {
  createAssignment,
  getAssignmentsByTeam,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  evaluateSubmission,
  reopenSubmission,
  getSubmissionsForAssignment,
} from '../services/assignmentService';
import { Types } from 'mongoose';

export const createAssignmentController = async (req: AuthRequest, res: Response) => {
  try {
    const leaderId = new Types.ObjectId(req.user!.id);
    const assignment = await createAssignment(req.body, leaderId);
    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getAssignmentsByTeamController = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const assignments = await getAssignmentsByTeam(teamId);
    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateAssignmentController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await updateAssignment(id, req.body);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAssignmentController = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const assignment = await deleteAssignment(id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const submitAssignmentController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const { id: assignmentId } = req.params;
    const { teamId, submissionType, githubUrl, notes } = req.body;
    let fileUrl = req.file ? `uploads/assignments/${req.file.filename}` : undefined;

    const submission = await submitAssignment({
      assignmentId,
      userId,
      teamId,
      submissionType,
      fileUrl,
      githubUrl,
      notes,
    });
    res.status(201).json(submission);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const evaluateSubmissionController = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const { marks, feedback, decision } = req.body;
    const submission = await evaluateSubmission(submissionId, Number(marks), feedback, decision);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const reopenSubmissionController = async (req: AuthRequest, res: Response) => {
  try {
    const { submissionId } = req.params;
    const submission = await reopenSubmission(submissionId);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json(submission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSubmissionsForAssignmentController = async (req: AuthRequest, res: Response) => {
  try {
    const { id: assignmentId } = req.params;
    const submissions = await getSubmissionsForAssignment(assignmentId);
    res.json(submissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
