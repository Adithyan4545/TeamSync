import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../models/User';
import { Team } from '../models/Team';
import { Hackathon } from '../models/Hackathon';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { Assignment } from '../models/Assignment';
import { Submission } from '../models/Submission';
import { Notification } from '../models/Notification';
import { Bookmark } from '../models/Bookmark';
import { TeamRequest } from '../models/TeamRequest';

async function clearAllData() {
  console.log('=== WIPING ALL DATABASE DATA ===');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log(` Connected to MongoDB: ${mongoUri}`);

  try {
    const userRes = await User.deleteMany({});
    const teamRes = await Team.deleteMany({});
    const hackathonRes = await Hackathon.deleteMany({});
    const extHackathonRes = await ExternalHackathon.deleteMany({});
    const assignmentRes = await Assignment.deleteMany({});
    const submissionRes = await Submission.deleteMany({});
    const notificationRes = await Notification.deleteMany({});
    const bookmarkRes = await Bookmark.deleteMany({});
    const teamRequestRes = await TeamRequest.deleteMany({});

    console.log('\n--- DELETION SUMMARY ---');
    console.log(`Users deleted: ${userRes.deletedCount}`);
    console.log(`Teams deleted: ${teamRes.deletedCount}`);
    console.log(`Community Hackathons deleted: ${hackathonRes.deletedCount}`);
    console.log(`External Hackathons deleted: ${extHackathonRes.deletedCount}`);
    console.log(`Assignments deleted: ${assignmentRes.deletedCount}`);
    console.log(`Submissions deleted: ${submissionRes.deletedCount}`);
    console.log(`Notifications deleted: ${notificationRes.deletedCount}`);
    console.log(`Bookmarks deleted: ${bookmarkRes.deletedCount}`);
    console.log(`Team Requests deleted: ${teamRequestRes.deletedCount}`);

    console.log('\n==================================================');
    console.log(' DATABASE WIPED CLEAN! ALL DATA HAS BEEN REMOVED.');
    console.log('==================================================');
  } catch (error) {
    console.error('❌ Error during data deletion:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

clearAllData();
