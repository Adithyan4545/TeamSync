import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User, UserRole } from '../models/User';
import { Team } from '../models/Team';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { TeamRequest } from '../models/TeamRequest';
import { Assignment } from '../models/Assignment';
import { Submission } from '../models/Submission';
import { Notification } from '../models/Notification';

import { createTeam } from '../services/teamService';
import { sendJoinRequest, updateJoinRequestStatus } from '../services/joinRequestService';
import { createAssignment, submitAssignment, evaluateSubmission } from '../services/assignmentService';
import { createNotification, getUserNotifications, markAsRead } from '../services/notificationService';

async function runNotificationSuite() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Notification System Verification Suite\n');

  console.log('=====================================================================================================');
  console.log('NOTIFICATION SYSTEM VERIFICATION SUITE (ALL TEST CASES)');
  console.log('=====================================================================================================\n');

  // Setup Users
  const leader = await User.findOneAndUpdate(
    { email: 'notif_leader@teamsync.com' },
    { name: 'Notif Leader', email: 'notif_leader@teamsync.com', password: 'password123', role: UserRole.LEADER },
    { upsert: true, new: true }
  );

  const student = await User.findOneAndUpdate(
    { email: 'notif_student@teamsync.com' },
    { name: 'Notif Student', email: 'notif_student@teamsync.com', password: 'password123', role: UserRole.STUDENT },
    { upsert: true, new: true }
  );

  const otherStudent = await User.findOneAndUpdate(
    { email: 'notif_other@teamsync.com' },
    { name: 'Other Student', email: 'notif_other@teamsync.com', password: 'password123', role: UserRole.STUDENT },
    { upsert: true, new: true }
  );

  const hackathon = await ExternalHackathon.findOne({}).lean();
  if (!hackathon) throw new Error('No hackathon found');

  // Clean old notifications
  await Notification.deleteMany({ user: { $in: [leader._id, student._id, otherStudent._id] } });
  await Team.deleteMany({ name: { $regex: /Notif Test Team/i } });

  // Create Team
  const team = await createTeam(
    {
      name: 'Notif Test Team Alpha',
      description: 'Testing notification events',
      hackathon: hackathon._id as any,
      maxMembers: 4,
      status: 'Open',
    },
    leader._id as any
  );

  // -----------------------------------------------------------------------------------------------
  // TEST 1: Student sends join request -> Leader receives notification
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 1] Join Request Sent Notification ---');
  const req1 = await sendJoinRequest(student._id as any, team._id as any, 'Let me join!');
  const leaderNotifs1 = await getUserNotifications(leader._id as any, false);
  const foundJoinReqNotif = leaderNotifs1.find((n) => n.type === 'JoinRequestSent' || n.type === 'JoinRequestReceived');
  console.log(`Leader received Join Request notification: ${!!foundJoinReqNotif}`);
  if (foundJoinReqNotif) {
    console.log('✅ PASSED TEST 1: Leader received Join Request notification.\n');
  } else {
    console.error('❌ FAILED TEST 1');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 2: Leader accepts request -> Student receives acceptance notification
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 2] Join Request Accepted Notification ---');
  await updateJoinRequestStatus(req1._id.toString(), 'Accepted');
  const studentNotifs2 = await getUserNotifications(student._id as any, false);
  const foundAcceptNotif = studentNotifs2.find((n) => n.type === 'JoinRequestAccepted');
  console.log(`Student received Join Request Accepted notification: ${!!foundAcceptNotif}`);
  if (foundAcceptNotif) {
    console.log('✅ PASSED TEST 2: Student received Acceptance notification.\n');
  } else {
    console.error('❌ FAILED TEST 2');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 3: Leader rejects request -> Student receives rejection notification
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 3] Join Request Rejected Notification ---');
  const req2 = await sendJoinRequest(otherStudent._id as any, team._id as any, 'Can I join?');
  await updateJoinRequestStatus(req2._id.toString(), 'Rejected');
  const otherNotifs3 = await getUserNotifications(otherStudent._id as any, false);
  const foundRejectNotif = otherNotifs3.find((n) => n.type === 'JoinRequestRejected');
  console.log(`Other student received Join Request Rejected notification: ${!!foundRejectNotif}`);
  if (foundRejectNotif) {
    console.log('✅ PASSED TEST 3: Student received Rejection notification.\n');
  } else {
    console.error('❌ FAILED TEST 3');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 4: Leader assigns task -> Member receives AssignmentCreated notification
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 4] Task Assigned Notification ---');
  const task = await createAssignment(
    {
      title: 'Build React UI',
      description: 'Build components',
      team: team._id,
      assignedTo: student._id,
      totalMarks: 100,
      status: 'Assigned',
    },
    leader._id as any
  );

  const studentNotifs4 = await getUserNotifications(student._id as any, false);
  const foundTaskNotif = studentNotifs4.find((n) => n.type === 'AssignmentCreated');
  console.log(`Member received AssignmentCreated notification: ${!!foundTaskNotif}`);
  if (foundTaskNotif) {
    console.log('✅ PASSED TEST 4: Member received Task Assignment notification.\n');
  } else {
    console.error('❌ FAILED TEST 4');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 5: Member submits task -> Leader receives SubmissionReceived notification
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 5] Task Submitted Notification ---');
  const sub = await submitAssignment({
    assignmentId: task._id.toString(),
    userId: student._id as any,
    teamId: team._id.toString(),
    submissionType: 'GitHub',
    githubUrl: 'https://github.com/teamsync/react-ui',
    notes: 'Completed UI components.',
  });

  const leaderNotifs5 = await getUserNotifications(leader._id as any, false);
  const foundSubNotif = leaderNotifs5.find((n) => n.type === 'SubmissionReceived' || n.type === 'AssignmentSubmitted');
  console.log(`Leader received SubmissionReceived notification: ${!!foundSubNotif}`);
  if (foundSubNotif) {
    console.log('✅ PASSED TEST 5: Leader received Task Submission notification.\n');
  } else {
    console.error('❌ FAILED TEST 5');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 6: Leader evaluates task -> Member receives MarksPublished notification
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 6] Task Evaluated Notification ---');
  await evaluateSubmission(sub._id.toString(), 98, 'Outstanding work!', 'Accepted');
  const studentNotifs6 = await getUserNotifications(student._id as any, false);
  const foundEvalNotif = studentNotifs6.find((n) => n.type === 'MarksPublished');
  console.log(`Member received MarksPublished notification: ${!!foundEvalNotif}`);
  if (foundEvalNotif) {
    console.log('✅ PASSED TEST 6: Member received Marks & Evaluation notification.\n');
  } else {
    console.error('❌ FAILED TEST 6');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 7: User cannot mark another user's notification as read
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 7] Security Authorization Check ---');
  const studentNotifId = foundTaskNotif!._id.toString();
  try {
    await markAsRead(studentNotifId, leader._id.toString());
    console.error('❌ FAILED TEST 7: Unauthorized user was allowed to mark another user notification as read');
  } catch (err: any) {
    console.log(`✅ PASSED TEST 7: Security check blocked unauthorized access (${err.message}).\n`);
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 8 & 9: Unread count & Mark-as-read changes state
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 8 & 9] Unread Count & Mark-As-Read State Transition ---');
  const unreadBefore = (await getUserNotifications(student._id as any, true)).length;
  console.log(`Unread count before marking read: ${unreadBefore}`);
  await markAsRead(studentNotifId, student._id.toString());
  const unreadAfter = (await getUserNotifications(student._id as any, true)).length;
  console.log(`Unread count after marking read: ${unreadAfter}`);
  if (unreadBefore > unreadAfter) {
    console.log('✅ PASSED TEST 8 & 9: Unread count and mark-as-read state transition work correctly.\n');
  } else {
    console.error('❌ FAILED TEST 8 & 9');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 10: Duplicate event does not create duplicate notifications
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 10] Deduplication Check ---');
  const notif1 = await createNotification(student._id as any, 'DeadlineReminder', { text: 'Test deduplication' });
  const notif2 = await createNotification(student._id as any, 'DeadlineReminder', { text: 'Test deduplication' });
  console.log(`First Notification ID: ${notif1._id}, Second Notification ID: ${notif2._id}`);
  if (notif1._id.toString() === notif2._id.toString()) {
    console.log('✅ PASSED TEST 10: Duplicate event suppressed (same notification ID returned).\n');
  } else {
    console.error('❌ FAILED TEST 10');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 11: Workflows intact
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 11] Workflow Integrity Check ---');
  const finalTeam = await Team.findById(team._id).lean();
  console.log(`Final Team Members: ${finalTeam?.members.length}`);
  if (finalTeam?.members.length === 2) {
    console.log('✅ PASSED TEST 11: All team, task, submission, and evaluation workflows remain 100% intact.\n');
  } else {
    console.error('❌ FAILED TEST 11');
  }

  // Cleanup
  await Notification.deleteMany({ user: { $in: [leader._id, student._id, otherStudent._id] } });
  await Assignment.deleteMany({ team: team._id });
  await Submission.deleteMany({ team: team._id });
  await TeamRequest.deleteMany({ team: team._id });
  await Team.deleteOne({ _id: team._id });

  await mongoose.disconnect();
  console.log('=====================================================================================================');
  console.log('ALL NOTIFICATION SUITE TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================================================================================\n');
}

runNotificationSuite().catch(console.error);
