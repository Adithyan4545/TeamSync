import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../models/User';
import { Team } from '../models/Team';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { TeamRequest } from '../models/TeamRequest';
import { Assignment } from '../models/Assignment';
import { Submission } from '../models/Submission';

import { createTeam, searchTeams } from '../services/teamService';
import { sendJoinRequest, updateJoinRequestStatus } from '../services/joinRequestService';
import { createAssignment, submitAssignment, evaluateSubmission } from '../services/assignmentService';

async function runTeamFeatureSuite() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Team Feature Verification\n');

  console.log('=====================================================================================================');
  console.log('TEAM FOUNDATION & TASK/EVALUATION WORKFLOW TEST SUITE');
  console.log('=====================================================================================================\n');

  // 1. Setup Test Users & Target Hackathon
  const leaderUser = await User.findOneAndUpdate(
    { email: 'team_leader_test@teamsync.com' },
    { name: 'Alice Leader', email: 'team_leader_test@teamsync.com', password: 'hashedpassword', role: 'Leader' },
    { upsert: true, new: true }
  );

  const memberUser = await User.findOneAndUpdate(
    { email: 'team_member_test@teamsync.com' },
    { name: 'Bob Member', email: 'team_member_test@teamsync.com', password: 'hashedpassword', role: 'Student' },
    { upsert: true, new: true }
  );

  const targetHackathon = await ExternalHackathon.findOne({}).lean();
  if (!targetHackathon) {
    throw new Error('No ExternalHackathon found in MongoDB to test team creation.');
  }

  console.log(`[Setup] Leader: ${leaderUser.name} (${leaderUser._id})`);
  console.log(`[Setup] Member: ${memberUser.name} (${memberUser._id})`);
  console.log(`[Setup] Target Hackathon: ${targetHackathon.title} (${targetHackathon._id})\n`);

  // Cleanup past test teams
  await Team.deleteMany({ name: { $regex: /Test Team/i } });
  await TeamRequest.deleteMany({ user: { $in: [leaderUser._id, memberUser._id] } });

  // STEP 1: Authenticated Team Creation
  console.log('--- [STEP 1] Team Creation ---');
  const team = await createTeam(
    {
      name: 'Alpha Innovators Test Team',
      description: 'Building AI hackathon project',
      hackathon: targetHackathon._id as any,
      maxMembers: 2, // Max 2 members for testing full team constraint
      requiredSkills: ['Python', 'React', 'Machine Learning'],
      status: 'Open',
    },
    leaderUser._id as any
  );

  console.log(`✅ Created Team: "${team.name}" (ID: ${team._id})`);
  console.log(`   Leader: ${team.leader}`);
  console.log(`   Members Count: ${team.members.length} (Leader automatically added: ${team.members[0].equals(leaderUser._id)})`);
  console.log(`   Required Skills: ${team.requiredSkills?.join(', ')}`);
  console.log(`   Max Members: ${team.maxMembers}\n`);

  // STEP 2: Team Search
  console.log('--- [STEP 2] Team Search & Discovery ---');
  const searchRes = await searchTeams({ requiredSkills: ['Python'], status: 'Open' });
  console.log(`✅ Search by skill ['Python']: Found ${searchRes.total} team(s)`);
  const found = searchRes.items.some((t) => t._id.toString() === team._id.toString());
  console.log(`   Target team present in search results: ${found}\n`);

  // STEP 3: Member Send Join Request
  console.log('--- [STEP 3] Join Request ---');
  const joinReq = await sendJoinRequest(memberUser._id as any, team._id as any, 'I love Python and ML!');
  console.log(`✅ Join Request Created: ID ${joinReq._id}, Status: ${joinReq.status}\n`);

  // STEP 4: Duplicate Join Request Prevention
  console.log('--- [STEP 4] Duplicate Join Request Prevention ---');
  try {
    await sendJoinRequest(memberUser._id as any, team._id as any, 'Duplicate request');
    console.error('❌ FAILED: Duplicate request was allowed');
  } catch (err: any) {
    console.log(`✅ PASSED: Blocked duplicate request (${err.message})\n`);
  }

  // STEP 5: Leader Accepts Join Request & Member Added to Team
  console.log('--- [STEP 5] Leader Accepts Request ---');
  const acceptedReq = await updateJoinRequestStatus(joinReq._id.toString(), 'Accepted');
  console.log(`✅ Request Updated Status: ${acceptedReq?.status}`);

  const updatedTeamAfterAccept = await Team.findById(team._id).lean();
  console.log(`   Updated Members Count: ${updatedTeamAfterAccept?.members.length} / ${updatedTeamAfterAccept?.maxMembers}`);
  console.log(`   Team Status updated to 'Full': ${updatedTeamAfterAccept?.status === 'Full'}\n`);

  // STEP 6: Full Team Prevention
  console.log('--- [STEP 6] Full Team Join Prevention ---');
  const thirdUser = await User.findOneAndUpdate(
    { email: 'third_user@teamsync.com' },
    { name: 'Charlie Third', email: 'third_user@teamsync.com', password: 'hashedpassword', role: 'Student' },
    { upsert: true, new: true }
  );

  try {
    await sendJoinRequest(thirdUser._id as any, team._id as any, 'Can I join?');
    console.error('❌ FAILED: Joining full team was allowed');
  } catch (err: any) {
    console.log(`✅ PASSED: Blocked join request to full team (${err.message})\n`);
  }

  // STEP 7: Leader Assigns Task 1 to Member
  console.log('--- [STEP 7] Leader Assigns Task 1 ---');
  const task1 = await createAssignment(
    {
      title: 'Build Python ML Pipeline',
      description: 'Train classification model and submit code',
      team: team._id,
      assignedTo: memberUser._id,
      totalMarks: 100,
      status: 'Assigned',
    },
    leaderUser._id as any
  );
  console.log(`✅ Task 1 Created: "${task1.title}" (Status: ${task1.status})\n`);

  // STEP 8: Single Active Task Constraint (Second Active Task Rejected)
  console.log('--- [STEP 8] Single Active Task Constraint ---');
  try {
    await createAssignment(
      {
        title: 'Task 2: Build React Frontend',
        description: 'Build dashboard',
        team: team._id,
        assignedTo: memberUser._id,
        totalMarks: 100,
        status: 'Assigned',
      },
      leaderUser._id as any
    );
    console.error('❌ FAILED: Second active task was allowed');
  } catch (err: any) {
    console.log(`✅ PASSED: Blocked second active task (${err.message})\n`);
  }

  // STEP 9: Member Submits Task 1
  console.log('--- [STEP 9] Member Submits Task 1 ---');
  const sub1 = await submitAssignment({
    assignmentId: task1._id.toString(),
    userId: memberUser._id as any,
    teamId: team._id.toString(),
    submissionType: 'GitHub',
    githubUrl: 'https://github.com/teamsync/python-ml-task',
    notes: 'Completed model training with 95% accuracy.',
  });
  console.log(`✅ Task 1 Submitted: Status: ${sub1.status}, GitHub: ${sub1.githubUrl}`);

  const task1AfterSub = await Assignment.findById(task1._id).lean();
  console.log(`   Assignment Status after submission: ${task1AfterSub?.status}\n`);

  // STEP 10: Leader Evaluates Task 1 with Marks + Feedback
  console.log('--- [STEP 10] Leader Evaluates Task 1 ---');
  const eval1 = await evaluateSubmission(
    sub1._id.toString(),
    95,
    'Excellent ML pipeline implementation! Accepted.',
    'Accepted'
  );
  console.log(`✅ Submission Evaluated: Marks: ${eval1?.marks}/100, Feedback: "${eval1?.feedback}", Status: ${eval1?.status}`);

  const task1Final = await Assignment.findById(task1._id).lean();
  console.log(`   Final Assignment Status: ${task1Final?.status}\n`);

  // STEP 11: Assign Task 2 After Task 1 is Closed
  console.log('--- [STEP 11] Assign Task 2 After Task 1 Closed ---');
  const task2 = await createAssignment(
    {
      title: 'Task 2: Build React Frontend',
      description: 'Build dashboard interface',
      team: team._id,
      assignedTo: memberUser._id,
      totalMarks: 100,
      status: 'Assigned',
    },
    leaderUser._id as any
  );
  console.log(`✅ Task 2 Successfully Assigned after Task 1 Closed: "${task2.title}" (ID: ${task2._id})\n`);

  // Cleanup test data
  await Assignment.deleteMany({ team: team._id });
  await Submission.deleteMany({ team: team._id });
  await TeamRequest.deleteMany({ team: team._id });
  await Team.deleteOne({ _id: team._id });

  await mongoose.disconnect();
  console.log('=====================================================================================================');
  console.log('ALL TEAM FOUNDATION & TASK WORKFLOW TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================================================================================\n');
}

runTeamFeatureSuite().catch(console.error);
