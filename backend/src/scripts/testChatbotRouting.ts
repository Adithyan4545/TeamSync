import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { handleAIChat } from '../services/ai/aiChatbotService';
import { Team } from '../models/Team';

async function runTests() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Chatbot Intent Verification\n');

  console.log('=====================================================================================================');
  console.log('RUNNING CHATBOT INTENT ROUTING VERIFICATION SUITE');
  console.log('=====================================================================================================\n');

  const tests = [
    { id: 'TEST 1', message: 'Help me find a team', expectZeroHackathons: true, expectTeams: true },
    { id: 'TEST 2', message: 'Which teams need Python developers?', expectZeroHackathons: true, expectTeams: true },
    { id: 'TEST 3', message: 'I want to join a team', expectZeroHackathons: true, expectTeams: true },
    { id: 'TEST 4', message: 'Find free AI hackathons', expectZeroTeams: true, expectHackathons: true },
    { id: 'TEST 5', message: 'Find me a team for an AI hackathon', expectCombined: true },
    { id: 'TEST 6', message: 'Which hackathon is best for me?', expectZeroTeams: true, expectHackathons: true },
  ];

  for (const t of tests) {
    try {
      const res = await handleAIChat({ message: t.message });
      console.log(`--- [${t.id}] Query: "${t.message}" ---`);
      console.log(`   Message Response: "${res.message.slice(0, 90)}..."`);
      console.log(`   Hackathons Returned Count: ${res.hackathons.length}`);
      console.log(`   Teams Returned Count: ${res.teams.length}`);
      console.log(`   Suggestions: ${res.suggestions.join(' | ')}`);

      if (t.expectZeroHackathons && res.hackathons.length > 0) {
        console.error(`❌ FAILED ${t.id}: Expected hackathons = 0, but got ${res.hackathons.length}`);
      } else if (t.expectZeroTeams && res.teams.length > 0) {
        console.error(`❌ FAILED ${t.id}: Expected teams = 0, but got ${res.teams.length}`);
      } else {
        console.log(`✅ PASSED ${t.id}\n`);
      }
    } catch (err: any) {
      console.error(`❌ ERROR ${t.id}: ${err.message}`);
    }
  }

  // TEST 7: 0 teams found in DB scenario
  console.log('--- [TEST 7] "Help me find a team" when 0 open teams exist in DB ---');
  // Temporarily set all open teams to Closed in DB transaction or mock query
  const openCount = await Team.countDocuments({ status: 'Open' });
  console.log(`Current Open Teams in MongoDB: ${openCount}`);

  // Test query
  const res7 = await handleAIChat({ message: 'Help me find a team' });
  console.log(`   Message Response: "${res7.message}"`);
  console.log(`   Hackathons Returned Count: ${res7.hackathons.length}`);
  console.log(`   Teams Returned Count: ${res7.teams.length}`);
  console.log(`   Suggestions: ${res7.suggestions.join(' | ')}`);

  if (res7.hackathons.length === 0 && res7.message.includes("couldn't find any open teams")) {
    console.log(`✅ PASSED TEST 7: Zero hackathons returned, clean no-team message delivered.\n`);
  } else {
    console.error(`❌ FAILED TEST 7: Hackathons count was ${res7.hackathons.length}, message was "${res7.message}"`);
  }

  await mongoose.disconnect();
}

runTests().catch(console.error);
