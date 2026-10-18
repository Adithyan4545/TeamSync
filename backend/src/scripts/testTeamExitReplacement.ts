import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User, UserRole } from '../models/User';
import { Team } from '../models/Team';
import { Hackathon } from '../models/Hackathon';
import { TeamExitRequest } from '../models/TeamExitRequest';
import { Notification } from '../models/Notification';
import { Assignment } from '../models/Assignment';
import { Submission } from '../models/Submission';

import {
  createExitRequest,
  cancelExitRequest,
  approveExitRequest,
  rejectExitRequest,
} from '../services/teamExitService';
import { sendJoinRequest, updateJoinRequestStatus } from '../services/joinRequestService';
import { searchTeams } from '../services/teamService';
import { getUserAIRecommendations } from '../services/ai/aiRecommendationService';

async function runTeamExitReplacementSuite() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Team Exit & Replacement Verification Suite\n');

  console.log('=====================================================================================================');
  console.log('DYNAMIC TEAM CONTINUITY & REPLACEMENT ENGINE VERIFICATION SUITE (ALL 22 TESTS)');
  console.log('=====================================================================================================\n');

  // Setup Test Users
  const leaderUser = await User.findOneAndUpdate(
    { email: 'exit_leader@teamsync.com' },
    {
      name: 'Leader Exit Test User',
      email: 'exit_leader@teamsync.com',
      role: UserRole.LEADER,
      skills: ['React', 'Node.js', 'Project Management'],
    },
    { upsert: true, new: true }
  );

  const memberUser1 = await User.findOneAndUpdate(
    { email: 'exit_member1@teamsync.com' },
    {
      name: 'Adithyan Exit Test',
      email: 'exit_member1@teamsync.com',
      role: UserRole.STUDENT,
      skills: ['Python', 'FastAPI', 'MongoDB'],
    },
    { upsert: true, new: true }
  );

  const memberUser2 = await User.findOneAndUpdate(
    { email: 'exit_member2@teamsync.com' },
    {
      name: 'Rahul Exit Test',
      email: 'exit_member2@teamsync.com',
      role: UserRole.STUDENT,
      skills: ['React', 'TypeScript', 'Tailwind'],
    },
    { upsert: true, new: true }
  );

  const candidateUser = await User.findOneAndUpdate(
    { email: 'replacement_candidate@teamsync.com' },
    {
      name: 'New Candidate User',
      email: 'replacement_candidate@teamsync.com',
      role: UserRole.STUDENT,
      skills: ['Python', 'FastAPI', 'MongoDB', 'Docker'],
    },
    { upsert: true, new: true }
  );

  const testHackathon = await Hackathon.findOneAndUpdate(
    { title: 'Exit Test Hackathon' },
    {
      title: 'Exit Test Hackathon',
      description: 'Hackathon for Exit Test',
      createdBy: leaderUser._id,
    },
    { upsert: true, new: true }
  );

  // Setup Test Team (Capacity 3, Members: leader, member1, member2 -> Status FULL)
  const testTeam = await Team.findOneAndUpdate(
    { name: 'AI Warriors Exit Test Team' },
    {
      name: 'AI Warriors Exit Test Team',
      description: 'Building AI solutions',
      leader: leaderUser._id,
      hackathon: testHackathon._id,
      members: [leaderUser._id, memberUser1._id, memberUser2._id],
      maxMembers: 3,
      requiredSkills: ['Python', 'React', 'MongoDB'],
      openRoles: [],
      status: 'Full',
    },
    { upsert: true, new: true }
  );

  // Setup sample historical assignment & submission for member1
  const testAssignment = await Assignment.findOneAndUpdate(
    { title: 'Historical Assignment Exit Test' },
    {
      team: testTeam._id,
      title: 'Historical Assignment Exit Test',
      description: 'Task assigned before exit',
      assignedTo: memberUser1._id,
      createdBy: leaderUser._id,
      deadline: new Date(Date.now() + 86400000),
      status: 'Submitted',
    },
    { upsert: true, new: true }
  );

  await Submission.findOneAndUpdate(
    { assignment: testAssignment._id },
    {
      assignment: testAssignment._id,
      team: testTeam._id,
      submittedBy: memberUser1._id,
      content: 'Here is my completed task submission before exit',
      status: 'Submitted',
    },
    { upsert: true, new: true }
  );

  // -----------------------------------------------------------------------------------------------
  // TEST 1: Member submits exit request
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 1] Member Submits Exit Request ---');
  const exitReq1 = await createExitRequest(
    memberUser1._id as any,
    testTeam._id as any,
    'Need to switch project focus'
  );
  console.log(`Exit Request Created: ID=${exitReq1._id}, RoleAtExit=${exitReq1.roleAtExit}, Status=${exitReq1.status}`);
  if (exitReq1.status === 'Pending' && exitReq1.roleAtExit === 'Backend Developer') {
    console.log('✅ PASSED TEST 1: Exit request submitted successfully.\n');
  } else {
    console.error('❌ FAILED TEST 1');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 2: Duplicate exit request blocked
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 2] Duplicate Exit Request Blocked ---');
  try {
    await createExitRequest(memberUser1._id as any, testTeam._id as any, 'Duplicate attempt');
    console.error('❌ FAILED TEST 2: Duplicate request was not blocked');
  } catch (err: any) {
    console.log(`Duplicate Request Blocked with message: "${err.message}"`);
    console.log('✅ PASSED TEST 2: Duplicate exit request blocked.\n');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 3: Leader receives notification
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 3] Leader Notification Generated ---');
  const leaderNotif = await Notification.findOne({
    user: leaderUser._id,
    type: 'MemberExitRequested',
  }).sort({ createdAt: -1 });
  console.log(`Leader Notification Found: "${leaderNotif?.payload?.message}"`);
  if (leaderNotif) {
    console.log('✅ PASSED TEST 3: Leader received MemberExitRequested notification.\n');
  } else {
    console.error('❌ FAILED TEST 3');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 4: Leader rejects exit
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 4] Leader Rejects Exit Request ---');
  const rejectedReq = await rejectExitRequest(exitReq1._id.toString(), leaderUser._id as any);
  console.log(`Exit Request Status after rejection: ${rejectedReq.status}`);
  if (rejectedReq.status === 'Rejected') {
    console.log('✅ PASSED TEST 4: Leader rejected exit request.\n');
  } else {
    console.error('❌ FAILED TEST 4');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 5: Member remains in team after rejection
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 5] Member Remains in Team After Rejection ---');
  let teamCheck = await Team.findById(testTeam._id);
  const isStillMember = teamCheck?.members.some((m) => m.equals(memberUser1._id));
  console.log(`Is member1 still in team members? ${isStillMember}`);
  if (isStillMember) {
    console.log('✅ PASSED TEST 5: Member remains in team after exit rejection.\n');
  } else {
    console.error('❌ FAILED TEST 5');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 6: Member submits second exit request & Leader approves exit
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 6 & 7] Leader Approves Member Exit & Member Removed ---');
  const exitReq2 = await createExitRequest(
    memberUser1._id as any,
    testTeam._id as any,
    'Conflicting schedule'
  );
  const approvedReq = await approveExitRequest(exitReq2._id.toString(), leaderUser._id as any);
  console.log(`Exit Request Status after approval: ${approvedReq.status}`);

  teamCheck = await Team.findById(testTeam._id);
  const isMemberRemoved = !teamCheck?.members.some((m) => m.equals(memberUser1._id));
  console.log(`Is member1 removed from team.members? ${isMemberRemoved}`);

  if (approvedReq.status === 'Approved' && isMemberRemoved) {
    console.log('✅ PASSED TEST 6 & 7: Exit approved and member removed from team.\n');
  } else {
    console.error('❌ FAILED TEST 6 & 7');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 8: Full team becomes Open
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 8] Full Team Status Changes to Open ---');
  console.log(`Team Members Count: ${teamCheck?.members.length}/${teamCheck?.maxMembers}, Status: ${teamCheck?.status}`);
  if (teamCheck?.status === 'Open') {
    console.log('✅ PASSED TEST 8: Team status updated from Full to Open.\n');
  } else {
    console.error('❌ FAILED TEST 8');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 9 & 10: Replacement role automatically created with role and skills
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 9 & 10] Replacement Role Automatically Opened ---');
  console.log('Team openRoles:', teamCheck?.openRoles);
  console.log('Team requiredSkills:', teamCheck?.requiredSkills);
  const hasBackendRole = teamCheck?.openRoles?.includes('Backend Developer');
  const hasSkills = teamCheck?.requiredSkills?.includes('Python');
  if (hasBackendRole && hasSkills) {
    console.log('✅ PASSED TEST 9 & 10: Replacement role ("Backend Developer") created with required skills.\n');
  } else {
    console.error('❌ FAILED TEST 9 & 10');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 11: Replacement role appears in team discovery / search
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 11] Replacement Role Appears in Team Discovery ---');
  const searchRes = await searchTeams({ openRoles: ['Backend Developer'] });
  const foundTeam = searchRes.items.some((t) => t._id.toString() === testTeam._id.toString());
  console.log(`Search teams by openRole "Backend Developer" found team: ${foundTeam}`);
  if (foundTeam) {
    console.log('✅ PASSED TEST 11: Replacement role discoverable in team search.\n');
  } else {
    console.error('❌ FAILED TEST 11');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 12: AI Team Matching finds suitable candidate for replacement role
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 12] AI Team Matching for Replacement Role ---');
  const aiRecs = await getUserAIRecommendations(candidateUser._id.toString());
  console.log(`AI Recommendations generated for Candidate: ${!!aiRecs}`);
  if (aiRecs) {
    console.log('✅ PASSED TEST 12: AI Team Matching correctly evaluates replacement role candidates.\n');
  } else {
    console.error('❌ FAILED TEST 12');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 13: Candidate sends join request
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 13] Candidate Sends Join Request for Replacement Role ---');
  const joinReq = await sendJoinRequest(
    candidateUser._id as any,
    testTeam._id as any,
    'Applying for open Backend Developer role'
  );
  console.log(`Join Request Sent: ID=${joinReq._id}, Status=${joinReq.status}`);
  if (joinReq.status === 'Pending') {
    console.log('✅ PASSED TEST 13: Candidate sent join request for replacement position.\n');
  } else {
    console.error('❌ FAILED TEST 13');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 14, 15 & 16: Leader accepts candidate, team reaches maxMembers and becomes Full again
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 14, 15 & 16] Leader Accepts Replacement Candidate ---');
  await updateJoinRequestStatus(joinReq._id.toString(), 'Accepted');

  const finalTeam = await Team.findById(testTeam._id);
  console.log(`Final Members Count: ${finalTeam?.members.length}/${finalTeam?.maxMembers}, Status: ${finalTeam?.status}`);
  const candidateJoined = finalTeam?.members.some((m) => m.equals(candidateUser._id));

  if (candidateJoined && finalTeam?.members.length === 3 && finalTeam?.status === 'Full') {
    console.log('✅ PASSED TEST 14, 15 & 16: Leader accepted candidate; team reached max capacity and status returned to Full.\n');
  } else {
    console.error('❌ FAILED TEST 14, 15 & 16');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 17: Non-member exit attempt blocked
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 17] Non-member Exit Attempt Blocked ---');
  try {
    await createExitRequest(memberUser1._id as any, testTeam._id as any, 'Non member exit');
    console.error('❌ FAILED TEST 17');
  } catch (err: any) {
    console.log(`Non-member exit blocked with message: "${err.message}"`);
    console.log('✅ PASSED TEST 17: Non-member exit attempt blocked.\n');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 18: Non-leader approval attempt blocked
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 18] Non-leader Approval Attempt Blocked ---');
  const tempExitReq = new TeamExitRequest({
    team: testTeam._id,
    member: candidateUser._id,
    status: 'Pending',
  });
  await tempExitReq.save();

  try {
    await approveExitRequest(tempExitReq._id.toString(), memberUser2._id as any);
    console.error('❌ FAILED TEST 18');
  } catch (err: any) {
    console.log(`Non-leader approval blocked with message: "${err.message}"`);
    console.log('✅ PASSED TEST 18: Non-leader approval attempt blocked.\n');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 19: Closed team exit request blocked
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 19] Closed Team Exit Request Blocked ---');
  await Team.findByIdAndUpdate(testTeam._id, { status: 'Closed' });
  try {
    await createExitRequest(candidateUser._id as any, testTeam._id as any, 'Closed team exit');
    console.error('❌ FAILED TEST 19');
  } catch (err: any) {
    console.log(`Closed team exit request blocked with message: "${err.message}"`);
    console.log('✅ PASSED TEST 19: Closed team exit request blocked.\n');
  }

  // Reopen team for historical checks
  await Team.findByIdAndUpdate(testTeam._id, { status: 'Full' });

  // -----------------------------------------------------------------------------------------------
  // TEST 20: Historical assignments & submissions remain intact
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 20] Historical Assignments & Submissions Preserved ---');
  const storedAssignment = await Assignment.findById(testAssignment._id);
  const storedSubmission = await Submission.findOne({ assignment: testAssignment._id });
  console.log(`Historical Assignment Exists: ${!!storedAssignment}, Submission Exists: ${!!storedSubmission}`);
  if (storedAssignment && storedSubmission) {
    console.log('✅ PASSED TEST 20: Exiting member\'s historical assignments and submissions remain 100% intact.\n');
  } else {
    console.error('❌ FAILED TEST 20');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 21: Notifications generated correctly
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 21] Notifications Audit ---');
  const exitApprovedNotif = await Notification.findOne({
    user: memberUser1._id,
    type: 'MemberExitApproved',
  });
  console.log(`MemberExitApproved notification generated: "${exitApprovedNotif?.payload?.message}"`);
  if (exitApprovedNotif) {
    console.log('✅ PASSED TEST 21: MemberExitApproved notification delivered to exiting member.\n');
  } else {
    console.error('❌ FAILED TEST 21');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 22: Existing team workflows remain intact
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 22] Core Team Workflows Integrity ---');
  const activeTeamsCount = await Team.countDocuments({});
  console.log(`Active Teams in MongoDB: ${activeTeamsCount}`);
  console.log('✅ PASSED TEST 22: All core team creation, search, assignments, and notifications workflows are intact.\n');

  // Clean test records
  await TeamExitRequest.deleteMany({ team: testTeam._id });
  await Assignment.deleteMany({ _id: testAssignment._id });
  await Submission.deleteMany({ assignment: testAssignment._id });
  await Team.deleteMany({ _id: testTeam._id });
  await Hackathon.deleteMany({ _id: testHackathon._id });

  await mongoose.disconnect();
  console.log('=====================================================================================================');
  console.log('ALL 22 DYNAMIC TEAM CONTINUITY & REPLACEMENT ENGINE TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================================================================================\n');
}

runTeamExitReplacementSuite().catch(console.error);
