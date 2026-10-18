import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Team } from '../models/Team';

async function investigateTeams() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Team Collection Inspection\n');

  const totalTeams = await Team.countDocuments({});
  const openTeamsCount = await Team.countDocuments({ status: 'Open' });
  const allTeams = await Team.find({}).lean();

  console.log(`Total Teams in MongoDB: ${totalTeams}`);
  console.log(`Open Status Teams in MongoDB: ${openTeamsCount}`);

  if (allTeams.length > 0) {
    console.log('\n--- Team Records in Database ---');
    allTeams.forEach((t, idx) => {
      console.log(`[${idx + 1}] ID: ${t._id} | Name: "${t.name}" | Status: ${t.status} | Hackathon: ${t.hackathon}`);
      console.log(`     Description: ${t.description}`);
      console.log(`     Required Skills: ${t.requiredSkills?.join(', ')}`);
      console.log(`     Members: ${t.members?.length || 0} / ${t.maxMembers}`);
    });
  } else {
    console.log('\n⚠️ No Team documents exist in the Team collection in MongoDB.');
  }

  await mongoose.disconnect();
}

investigateTeams().catch(console.error);
