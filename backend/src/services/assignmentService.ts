import { Assignment, IAssignment } from '../models/Assignment';
import { Submission, ISubmission } from '../models/Submission';
import { Types } from 'mongoose';
import { createNotification } from './notificationService';
import { sendSystemMessage } from './teamService';

export const createAssignment = async (data: any, createdBy: Types.ObjectId) => {
  const teamId = data.team || data.teamId;

  // Enforce single active task per member constraint
  if (data.assignedTo) {
    const activeExisting = await Assignment.findOne({
      team: teamId,
      assignedTo: data.assignedTo,
      status: { $ne: 'Closed' }
    }).lean();

    if (activeExisting) {
      throw new Error('This team member is already working on an active task. A member can only be assigned 1 active assignment at a time.');
    }
  }

  const assignment = new Assignment({ ...data, team: teamId, createdBy });
  const saved = await assignment.save();

  // Notify team members
  const team = await (await import('../models/Team')).Team.findById(teamId).lean();
  if (team?.members) {
    for (const memberId of team.members) {
      if (!memberId.equals(createdBy)) {
        await createNotification(memberId as Types.ObjectId, 'AssignmentCreated' as any, {
          assignmentId: saved._id,
          teamId,
          title: data.title,
          message: data.assignedTo && data.assignedTo.toString() === memberId.toString()
            ? `You have been assigned a new task: "${data.title}"`
            : `New task published in team: "${data.title}"`,
        });
      }
    }
  }

  if (data.assignedTo) {
    const userModel = (await import('../models/User')).User;
    const assignedUser = await userModel.findById(data.assignedTo).lean();
    if (assignedUser) {
      await sendSystemMessage(teamId.toString(), `📋 ${assignedUser.name} was assigned a new task: "${data.title}"`);
    }
  } else {
    await sendSystemMessage(teamId.toString(), `📋 New task published: "${data.title}"`);
  }

  return saved;
};

export const getAssignmentsByTeam = async (teamId: string) => {
  const assignments = await Assignment.find({ team: teamId })
    .populate('assignedTo', 'name email avatarUrl')
    .populate('createdBy', 'name email avatarUrl')
    .sort({ createdAt: -1 })
    .lean();

  const results = [];
  for (const a of assignments) {
    const submission = await Submission.findOne({ assignment: a._id }).lean();
    results.push({
      ...a,
      submission: submission ? {
        _id: submission._id,
        marks: submission.marks,
        feedback: submission.feedback,
        status: submission.status,
        submissionType: submission.submissionType,
        githubUrl: submission.githubUrl,
        fileUrl: submission.fileUrl,
        notes: submission.notes,
        createdAt: submission.createdAt,
      } : null,
    });
  }
  return results;
};

export const updateAssignment = async (id: string, updates: Partial<IAssignment>) => {
  if (updates.assignedTo) {
    const currentTask = await Assignment.findById(id).lean();
    if (currentTask && currentTask.assignedTo?.toString() !== updates.assignedTo.toString()) {
      const activeExisting = await Assignment.findOne({
        _id: { $ne: id },
        team: currentTask.team,
        assignedTo: updates.assignedTo,
        status: { $ne: 'Closed' }
      }).lean();

      if (activeExisting) {
        throw new Error('This team member is already working on an active task. A member can only be assigned 1 active assignment at a time.');
      }
    }
  }

  return await Assignment.findByIdAndUpdate(id, updates, { new: true })
    .populate('assignedTo', 'name email avatarUrl')
    .populate('createdBy', 'name email avatarUrl')
    .lean();
};

export const deleteAssignment = async (id: string) => {
  await Submission.deleteMany({ assignment: id });
  return await Assignment.findByIdAndDelete(id).lean();
};

export const submitAssignment = async (data: {
  assignmentId: string;
  userId: Types.ObjectId;
  teamId: string;
  submissionType: 'ZIP' | 'PDF' | 'GitHub';
  fileUrl?: string;
  githubUrl?: string;
  notes?: string;
}) => {
  const existing = await Submission.findOne({ assignment: data.assignmentId, user: data.userId });
  let saved;
  if (existing) {
    existing.submissionType = data.submissionType;
    existing.fileUrl = data.fileUrl;
    existing.githubUrl = data.githubUrl;
    existing.notes = data.notes;
    existing.status = 'Submitted';
    saved = await existing.save();
  } else {
    const submission = new Submission({
      assignment: data.assignmentId,
      user: data.userId,
      team: data.teamId,
      submissionType: data.submissionType,
      fileUrl: data.fileUrl,
      githubUrl: data.githubUrl,
      notes: data.notes,
      status: 'Submitted',
    });
    saved = await submission.save();
  }

  // Update assignment status in database to 'Closed' (Done/Completed)
  await Assignment.findByIdAndUpdate(data.assignmentId, { status: 'Closed' });

  // Notify team leader
  const team = await (await import('../models/Team')).Team.findById(data.teamId).lean();
  if (team?.leader) {
    await createNotification(team.leader as Types.ObjectId, 'SubmissionReceived' as any, {
      submissionId: saved._id,
      assignmentId: data.assignmentId,
    });
  }

  const userModel = (await import('../models/User')).User;
  const submitter = await userModel.findById(data.userId).lean();
  if (submitter) {
    await sendSystemMessage(data.teamId.toString(), `📤 ${submitter.name} submitted a task.`);
  }

  return saved;
};

export const evaluateSubmission = async (
  submissionId: string,
  marks: number,
  feedback?: string,
  decision: 'Accepted' | 'Rejected' = 'Accepted'
) => {
  const status = decision === 'Rejected' ? 'Rejected' : 'Accepted';
  const submission = await Submission.findByIdAndUpdate(
    submissionId,
    { marks, feedback, status },
    { new: true }
  ).lean();

  if (submission) {
    const assignmentStatus = decision === 'Rejected' ? 'Open' : 'Closed';
    const updatedAssignment = await Assignment.findByIdAndUpdate(submission.assignment, { status: assignmentStatus }, { new: true }).lean();
    const taskTitle = updatedAssignment?.title || 'Assignment';

    await createNotification(submission.user as Types.ObjectId, 'MarksPublished' as any, {
      submissionId: submission._id,
      marks,
      feedback,
      decision: status,
      title: decision === 'Accepted' ? '🎉 Task Accepted & Member Selected!' : '❌ Task Rejected / Revision Required',
      message: decision === 'Rejected'
        ? `Your task "${taskTitle}" was evaluated with ${marks}/100 marks and Marked as Rejected / Needs Revision. Description/Feedback: "${feedback || 'No feedback provided'}"`
        : `Congratulations! Your task "${taskTitle}" was Accepted by your leader with ${marks}/100 marks! Description/Feedback: "${feedback || 'Great performance!'}"`,
    });

    if (decision === 'Accepted') {
      const userModel = (await import('../models/User')).User;
      const submitterUser = await userModel.findById(submission.user).lean();
      if (submitterUser && submission.team) {
        await sendSystemMessage(submission.team.toString(), `✅ Task "${taskTitle}" submitted by ${submitterUser.name} was accepted!`);
      }
    }
  }
  return submission;
};

export const reopenSubmission = async (submissionId: string) => {
  return await Submission.findByIdAndUpdate(
    submissionId,
    { status: 'Reopened' },
    { new: true }
  ).lean();
};

export const getSubmissionsForAssignment = async (assignmentId: string) => {
  return await Submission.find({ assignment: assignmentId }).populate('user').lean();
};
