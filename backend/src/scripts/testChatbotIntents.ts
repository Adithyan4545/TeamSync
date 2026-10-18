import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function detectIntent(message: string): 'TEAM_SEARCH' | 'HACKATHON_SEARCH' | 'COMBINED' | 'HACKATHON_RECOMMENDATION' {
  const msgLower = message.toLowerCase();

  const mentionsTeam = /\b(team|teams|teammate|teammates|join a team|find a team|need teammates|looking for members|need developers)\b/i.test(msgLower);
  const mentionsHackathon = /\b(hackathon|hackathons|competition|event|challenge|hackmatrix)\b/i.test(msgLower);

  if (mentionsTeam && mentionsHackathon) {
    return 'COMBINED';
  }
  if (mentionsTeam) {
    return 'TEAM_SEARCH';
  }
  if (msgLower.includes('best for me') || msgLower.includes('recommend') || msgLower.includes('suggest a hackathon')) {
    return 'HACKATHON_RECOMMENDATION';
  }
  return 'HACKATHON_SEARCH';
}

const testQueries = [
  "Help me find a team",
  "Which teams need Python developers?",
  "I want to join a team",
  "Find free AI hackathons",
  "Find me a team for an AI hackathon",
  "Which hackathon is best for me?"
];

console.log('===========================================================');
console.log('INTENT DETECTION DRILL');
console.log('===========================================================\n');

testQueries.forEach((q, idx) => {
  const intent = detectIntent(q);
  console.log(`[Test ${idx + 1}] Query: "${q}"`);
  console.log(`         Detected Intent: ${intent}`);
});
