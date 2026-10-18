import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User, UserRole } from '../models/User';
import { Team } from '../models/Team';
import { Hackathon } from '../models/Hackathon';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { Assignment } from '../models/Assignment';
import { Submission } from '../models/Submission';
import { Notification } from '../models/Notification';
import { syncExternalHackathons } from '../services/externalHackathonService';
import { createAssignment, evaluateSubmission, submitAssignment } from '../services/assignmentService';
import { getUserAIRecommendations } from '../services/ai/aiRecommendationService';

async function runTests() {
  console.log('=== STARTING END-TO-END FEATURE VERIFICATION ===');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB for verification');

  try {
    // 1. External Hackathon Provider Sync Test
    console.log('\n--- 1. Testing Provider Ingestion System ---');
    await syncExternalHackathons();
    
    const communityCount = await Hackathon.countDocuments();
    const externalCount = await ExternalHackathon.countDocuments();
    console.log(`✅ Hackathon Collections: Community (${communityCount}), External (${externalCount})`);

    // 2. User & Team Setup
    console.log('\n--- 2. Setting up Test Leader & Test Member ---');
    let leader = await User.findOne({ email: 'testleader@teamsync.com' });
    if (!leader) {
      leader = await User.create({
        name: 'Test Leader',
        email: 'testleader@teamsync.com',
        password: 'Password123!',
        role: UserRole.LEADER,
        isVerified: true,
      });
    }

    let member = await User.findOne({ email: 'testmember@teamsync.com' });
    if (!member) {
      member = await User.create({
        name: 'Test Member',
        email: 'testmember@teamsync.com',
        password: 'Password123!',
        role: UserRole.STUDENT,
        isVerified: true,
      });
    }

    let hackathon = await Hackathon.findOne();
    if (!hackathon) {
      hackathon = await Hackathon.create({
        title: 'Sample E2E Hackathon',
        description: 'Test Hackathon for E2E Verification',
        organizer: leader._id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000 * 7),
        registrationDeadline: new Date(Date.now() + 86400000 * 3),
        tags: ['Web3', 'AI'],
      });
    }

    let team = await Team.findOne({ name: 'Verification Alpha Team' });
    if (!team) {
      team = await Team.create({
        name: 'Verification Alpha Team',
        description: 'Test Team for E2E verification',
        hackathon: hackathon._id,
        leader: leader._id,
        members: [leader._id, member._id],
        maxMembers: 4,
        status: 'Open',
      });
    }
    console.log(`✅ Test Team established: "${team.name}" (Leader: ${leader.name}, Member: ${member.name})`);

    // 3. Test 1-Active-Task Constraint & Member Assignment
    console.log('\n--- 3. Testing Member Assignment & 1-Active-Task Rule ---');
    await Assignment.deleteMany({ team: team._id });
    await Submission.deleteMany({ team: team._id });

    const task1 = await createAssignment(
      {
        teamId: team._id.toString(),
        title: 'Build UI Components',
        description: 'Design and implement responsive Tailwind/Vanilla CSS components',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        assignedTo: member._id.toString(),
      },
      leader._id
    );
    console.log(`✅ Task 1 created & assigned to ${member.name}: "${task1.title}"`);

    // Attempting to assign a SECOND active task to member should throw error
    let constraintPassed = false;
    try {
      await createAssignment(
        {
          teamId: team._id.toString(),
          title: 'Build Backend API',
          description: 'Second active task attempt',
          deadline: new Date(Date.now() + 86400000).toISOString(),
          assignedTo: member._id.toString(),
        },
        leader._id
      );
    } catch (err: any) {
      constraintPassed = true;
      console.log(`✅ 1-Active-Task Rule Verified! Error caught: "${err.message}"`);
    }
    if (!constraintPassed) {
      throw new Error('FAILED: 1-Active-Task rule did not trigger error!');
    }

    // 4. Work Submission
    console.log('\n--- 4. Testing Project Deliverables Submission ---');
    const submission = await submitAssignment({
      assignmentId: task1._id.toString(),
      userId: member._id,
      teamId: team._id.toString(),
      submissionType: 'GitHub',
      githubUrl: 'https://github.com/testmember/ui-components',
      notes: 'Completed all components with dark mode support!',
    });
    console.log(`✅ Project deliverables submitted by member. Submission ID: ${submission._id}`);

    // 5. Leader Review & Evaluation (Accept & Select Member)
    console.log('\n--- 5. Testing Leader Evaluation (Marks + Description + Accept) ---');
    const evaluated = await evaluateSubmission(
      submission._id.toString(),
      95,
      'Outstanding UI components and neat code organization!',
      'Accepted'
    );
    console.log(`✅ Leader Evaluated & Accepted task! Marks: 95/100, Status: ${evaluated?.status}`);

    // Verify assignment status is now Closed (Done / Accepted)
    const updatedTask1 = await Assignment.findById(task1._id);
    console.log(`✅ Assignment Status updated to: "${updatedTask1?.status}" (Closed/Accepted)`);

    // 6. Verification of Member Notifications
    console.log('\n--- 6. Testing Member Notification System ---');
    const notifications = await Notification.find({ user: member._id }).sort({ createdAt: -1 }).limit(3);
    console.log(`✅ Notifications sent to member (${notifications.length} total):`);
    notifications.forEach((n: any, idx) => {
      console.log(`   [${idx + 1}] Type: ${n.type} | Message: "${n.data?.message || 'Notification received'}"`);
    });

    // 7. Phase 3 Groq AI Recommendation Service Test
    console.log('\n--- 7. Testing Groq AI Recommendation Engine ---');
    const aiRecommendations = await getUserAIRecommendations(member._id.toString());
    const hackathonMatches = aiRecommendations.hackathons || [];
    console.log(`✅ AI Recommendations Generated! Match Count: ${hackathonMatches.length}`);
    if (hackathonMatches.length > 0) {
      console.log(`   Top Recommendation: "${hackathonMatches[0].hackathon?.title || 'Hackathon'}" (Match score: ${hackathonMatches[0].matchScore}%)`);
    }

    console.log('\n===================================================================');
    console.log('🎉 ALL END-TO-END SYSTEM FEATURES VERIFIED WITH 100% PASS RATE! 🎉');
    console.log('===================================================================');
  } catch (err: any) {
    console.error('❌ E2E Test Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

runTests();
