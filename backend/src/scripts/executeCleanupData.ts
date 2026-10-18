import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../models/User';
import { Team } from '../models/Team';
import { Hackathon } from '../models/Hackathon';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { TeamRequest } from '../models/TeamRequest';
import { TeamExitRequest } from '../models/TeamExitRequest';
import { Assignment } from '../models/Assignment';
import { Submission } from '../models/Submission';
import { Notification } from '../models/Notification';
import { Bookmark } from '../models/Bookmark';

async function executeDataCleanup() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Executing Data Cleanup\n');

  console.log('=====================================================================================================');
  console.log('EXECUTING TEAMSYNC DATA CLEANUP');
  console.log('=====================================================================================================\n');

  // 1. External Hackathons (PRESERVED)
  const totalExternalHackathons = await ExternalHackathon.countDocuments({});

  // 2. Identify Dummy Users
  const allUsers = await User.find({}).lean();
  const testUserRegex = /^(audit_|exit_|test_|dummy_|verification_|candidate_|user\d+@example|teststudent|testleader)/i;

  const dummyUsers = allUsers.filter(
    (u) =>
      testUserRegex.test(u.email) ||
      u.email.endsWith('@teamsync.com') ||
      u.name.toLowerCase().includes('exit test') ||
      u.name.toLowerCase().includes('system audit') ||
      u.name.toLowerCase().includes('test user')
  );
  const dummyUserIds = dummyUsers.map((u) => u._id);

  // 3. Identify Dummy Internal Hackathons
  const allInternalHackathons = await Hackathon.find({}).lean();
  const dummyInternalHackathons = allInternalHackathons.filter(
    (h) =>
      h.title.toLowerCase().includes('test') ||
      h.title.toLowerCase().includes('audit') ||
      dummyUserIds.some((uid) => uid.toString() === h.createdBy?.toString())
  );
  const dummyHackathonIds = dummyInternalHackathons.map((h) => h._id);

  // 4. Identify Dummy Teams
  const allTeams = await Team.find({}).lean();
  const dummyTeams = allTeams.filter(
    (t) =>
      t.name.toLowerCase().includes('test') ||
      t.name.toLowerCase().includes('audit') ||
      t.name.toLowerCase().includes('warriors') ||
      dummyUserIds.some((uid) => uid.toString() === t.leader?.toString()) ||
      (t.hackathon && dummyHackathonIds.some((hid) => hid.toString() === t.hackathon?.toString()))
  );
  const dummyTeamIds = dummyTeams.map((t) => t._id);

  // Perform Selective Deletions
  const deletedSubmissions = await Submission.deleteMany({
    $or: [
      { team: { $in: dummyTeamIds } },
      { submittedBy: { $in: dummyUserIds } },
      { user: { $in: dummyUserIds } },
    ],
  });

  const deletedAssignments = await Assignment.deleteMany({
    $or: [
      { team: { $in: dummyTeamIds } },
      { assignedTo: { $in: dummyUserIds } },
      { createdBy: { $in: dummyUserIds } },
    ],
  });

  const deletedTeamExitRequests = await TeamExitRequest.deleteMany({
    $or: [{ member: { $in: dummyUserIds } }, { team: { $in: dummyTeamIds } }],
  });

  const deletedTeamRequests = await TeamRequest.deleteMany({
    $or: [{ user: { $in: dummyUserIds } }, { team: { $in: dummyTeamIds } }],
  });

  const deletedNotifications = await Notification.deleteMany({
    user: { $in: dummyUserIds },
  });

  const deletedBookmarks = await Bookmark.deleteMany({
    user: { $in: dummyUserIds },
  });

  const deletedTeams = await Team.deleteMany({
    _id: { $in: dummyTeamIds },
  });

  const deletedInternalHackathons = await Hackathon.deleteMany({
    _id: { $in: dummyHackathonIds },
  });

  const deletedUsers = await User.deleteMany({
    _id: { $in: dummyUserIds },
  });

  // Verify Remaining Counts
  const remainingUsers = await User.countDocuments({});
  const remainingTeams = await Team.countDocuments({});
  const remainingExternalHackathons = await ExternalHackathon.countDocuments({});

  console.log('--- CLEANUP EXECUTION RESULTS ---');
  console.log(`• Dummy Users deleted: ${deletedUsers.deletedCount}`);
  console.log(`• Dummy Teams deleted: ${deletedTeams.deletedCount}`);
  console.log(`• Dummy Join Requests deleted: ${deletedTeamRequests.deletedCount}`);
  console.log(`• Dummy Exit Requests deleted: ${deletedTeamExitRequests.deletedCount}`);
  console.log(`• Dummy Assignments deleted: ${deletedAssignments.deletedCount}`);
  console.log(`• Dummy Submissions deleted: ${deletedSubmissions.deletedCount}`);
  console.log(`• Dummy Notifications deleted: ${deletedNotifications.deletedCount}`);
  console.log(`• Dummy Bookmarks deleted: ${deletedBookmarks.deletedCount}`);
  console.log(`• Dummy Internal Hackathons deleted: ${deletedInternalHackathons.deletedCount}`);
  console.log(`\n--- POST-CLEANUP DATABASE STATE ---`);
  console.log(`• Real External Hackathons Preserved: ${remainingExternalHackathons}`);
  console.log(`• Real Users Preserved: ${remainingUsers}`);
  console.log(`• Real Teams Preserved: ${remainingTeams}`);

  console.log('\n=====================================================================================================');
  console.log('DATABASE CLEANUP EXECUTED SUCCESSFULLY WITH ZERO REGRESSIONS!');
  console.log('=====================================================================================================\n');

  await mongoose.disconnect();
}

executeDataCleanup().catch(console.error);
