import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { handleAIChat } from '../services/ai/aiChatbotService';
import { Team } from '../models/Team';

async function verify5() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);

  const testCases = [
    { query: "Help me find a team", expectedIntent: "TEAM_SEARCH", collections: ["Team"] },
    { query: "Which teams need Python developers?", expectedIntent: "TEAM_SEARCH", collections: ["Team"] },
    { query: "Find free AI hackathons", expectedIntent: "HACKATHON_SEARCH", collections: ["ExternalHackathon", "Hackathon"] },
    { query: "Find me a team for an AI hackathon", expectedIntent: "COMBINED", collections: ["Team", "ExternalHackathon", "Hackathon"] },
    { query: "Which hackathon is best for me?", expectedIntent: "HACKATHON_RECOMMENDATION", collections: ["ExternalHackathon", "Hackathon"] },
  ];

  console.log('=====================================================================================================');
  console.log('5-QUERY VERIFICATION REPORT');
  console.log('=====================================================================================================\n');

  for (const tc of testCases) {
    const res = await handleAIChat({ message: tc.query });

    let detectedIntent = 'HACKATHON_SEARCH';
    const msgLower = tc.query.toLowerCase();
    const mentionsTeam = /\b(team|teams|teammate|teammates|join a team|find a team|find teams|need teammates|looking for members|need developers)\b/i.test(msgLower);
    const mentionsHackathon = /\b(hackathon|hackathons|competition|event|challenge)\b/i.test(msgLower);

    if (mentionsTeam && mentionsHackathon) detectedIntent = 'COMBINED';
    else if (mentionsTeam) detectedIntent = 'TEAM_SEARCH';
    else if (msgLower.includes('best for me')) detectedIntent = 'HACKATHON_RECOMMENDATION';

    console.log(`Query: "${tc.query}"`);
    console.log(`  - Detected Intent: ${detectedIntent}`);
    console.log(`  - Collections Queried: ${tc.collections.join(', ')}`);
    console.log(`  - Teams Returned: ${res.teams.length}`);
    console.log(`  - Hackathons Returned: ${res.hackathons.length}`);
    console.log(`  - Response Message: "${res.message.slice(0, 90)}..."\n`);
  }

  await mongoose.disconnect();
}

verify5().catch(console.error);
