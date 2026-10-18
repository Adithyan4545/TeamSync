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

async function inspectAndPreviewCleanup() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Data Inspection & Cleanup Preview\n');

  console.log('=====================================================================================================');
  console.log('TEAMSYNC DATABASE INSPECTION & CLEANUP PREVIEW');
  console.log('=====================================================================================================\n');

  // 1. External Hackathons (MUST PRESERVE 100%)
  const totalExternalHackathons = await ExternalHackathon.countDocuments({});
  const realExternalCount = totalExternalHackathons; // All external hackathons from providers are real

  // 2. Users
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

  const realUsers = allUsers.filter((u) => !dummyUsers.some((du) => du._id.toString() === u._id.toString()));

  const dummyUserIds = dummyUsers.map((u) => u._id);

  // 3. Hackathons (Internal)
  const allInternalHackathons = await Hackathon.find({}).lean();
  const dummyInternalHackathons = allInternalHackathons.filter(
    (h) =>
      h.title.toLowerCase().includes('test') ||
      h.title.toLowerCase().includes('audit') ||
      dummyUserIds.some((uid) => uid.toString() === h.createdBy?.toString())
  );
  const realInternalHackathons = allInternalHackathons.filter(
    (h) => !dummyInternalHackathons.some((dh) => dh._id.toString() === h._id.toString())
  );
  const dummyHackathonIds = dummyInternalHackathons.map((h) => h._id);

  // 4. Teams
  const allTeams = await Team.find({}).lean();
  const dummyTeams = allTeams.filter(
    (t) =>
      t.name.toLowerCase().includes('test') ||
      t.name.toLowerCase().includes('audit') ||
      t.name.toLowerCase().includes('warriors') ||
      dummyUserIds.some((uid) => uid.toString() === t.leader?.toString()) ||
      (t.hackathon && dummyHackathonIds.some((hid) => hid.toString() === t.hackathon?.toString()))
  );
  const realTeams = allTeams.filter((t) => !dummyTeams.some((dt) => dt._id.toString() === t._id.toString()));
  const dummyTeamIds = dummyTeams.map((t) => t._id);

  // 5. Team Requests / Join Requests
  const dummyTeamRequests = await TeamRequest.find({
    $or: [{ user: { $in: dummyUserIds } }, { team: { $in: dummyTeamIds } }],
  }).lean();

  // 6. Team Exit Requests
  const dummyTeamExitRequests = await TeamExitRequest.find({
    $or: [{ member: { $in: dummyUserIds } }, { team: { $in: dummyTeamIds } }],
  }).lean();

  // 7. Assignments
  const dummyAssignments = await Assignment.find({
    $or: [
      { team: { $in: dummyTeamIds } },
      { assignedTo: { $in: dummyUserIds } },
      { createdBy: { $in: dummyUserIds } },
    ],
  }).lean();
  const dummyAssignmentIds = dummyAssignments.map((a) => a._id);

  // 8. Submissions
  const dummySubmissions = await Submission.find({
    $or: [
      { assignment: { $in: dummyAssignmentIds } },
      { team: { $in: dummyTeamIds } },
      { submittedBy: { $in: dummyUserIds } },
      { user: { $in: dummyUserIds } },
    ],
  }).lean();

  // 9. Notifications
  const dummyNotifications = await Notification.find({
    user: { $in: dummyUserIds },
  }).lean();

  // 10. Bookmarks
  const dummyBookmarks = await Bookmark.find({
    user: { $in: dummyUserIds },
  }).lean();

  console.log('--- DETAILED CLASSIFICATION SUMMARY ---');
  console.log(`• External Hackathons (Providers): ${totalExternalHackathons} (PRESERVING ALL 100%)`);
  console.log(`• Internal Hackathons: Total = ${allInternalHackathons.length} | Real = ${realInternalHackathons.length} | Test = ${dummyInternalHackathons.length}`);
  console.log(`• Users: Total = ${allUsers.length} | Real = ${realUsers.length} | Test = ${dummyUsers.length}`);
  console.log(`• Teams: Total = ${allTeams.length} | Real = ${realTeams.length} | Test = ${dummyTeams.length}`);
  console.log(`• Join Requests (TeamRequest): Test Records = ${dummyTeamRequests.length}`);
  console.log(`• Exit Requests (TeamExitRequest): Test Records = ${dummyTeamExitRequests.length}`);
  console.log(`• Assignments: Test Records = ${dummyAssignments.length}`);
  console.log(`• Submissions: Test Records = ${dummySubmissions.length}`);
  console.log(`• Notifications: Test Records = ${dummyNotifications.length}`);
  console.log(`• Bookmarks: Test Records = ${dummyBookmarks.length}`);

  console.log('\n--- DUMMY / TEST USERS IDENTIFIED FOR DELETION ---');
  dummyUsers.forEach((u) => console.log(`  - [User ID: ${u._id}] ${u.name} (${u.email})`));

  console.log('\n--- DUMMY / TEST TEAMS IDENTIFIED FOR DELETION ---');
  dummyTeams.forEach((t) => console.log(`  - [Team ID: ${t._id}] ${t.name}`));

  console.log('\n--- REAL USERS PRESERVED ---');
  if (realUsers.length === 0) console.log('  (No production users registered yet)');
  else realUsers.forEach((u) => console.log(`  + [User ID: ${u._id}] ${u.name} (${u.email})`));

  console.log('\n=====================================================================================================');
  console.log(`SUMMARY: REAL HACKATHONS PRESERVED = ${realExternalCount}`);
  console.log(`DUMMY RECORDS IDENTIFIED: Users(${dummyUsers.length}), Teams(${dummyTeams.length}), JoinReqs(${dummyTeamRequests.length}), ExitReqs(${dummyTeamExitRequests.length}), Assignments(${dummyAssignments.length}), Submissions(${dummySubmissions.length}), Notifications(${dummyNotifications.length}), Bookmarks(${dummyBookmarks.length})`);
  console.log('=====================================================================================================\n');

  console.log('Cleanup preview completed. No records have been deleted.');
  await mongoose.disconnect();
}

inspectAndPreviewCleanup().catch(console.error);
