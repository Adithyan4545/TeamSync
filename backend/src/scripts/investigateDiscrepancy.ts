import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ExternalHackathon } from '../models/ExternalHackathon';

async function investigate() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const now = new Date();

  const allDocs = await ExternalHackathon.find({}).lean();
  console.log(`Total ExternalHackathon records: ${allDocs.length}`);

  let expiredDeadlineCount = 0;
  let expiredEventCount = 0;
  let closedCount = 0;
  let activeCount = 0;

  const activeDocs: any[] = [];
  const expiredDeadlineButNotClosed: any[] = [];
  const expiredEventButNotClosed: any[] = [];

  for (const doc of allDocs) {
    const isDeadlinePast = doc.registrationDeadline ? new Date(doc.registrationDeadline) < now : false;
    const isEventPast = doc.eventDate ? new Date(doc.eventDate) < now : false;
    const isClosed = doc.status === 'Closed';

    if (isDeadlinePast) expiredDeadlineCount++;
    if (isEventPast) expiredEventCount++;
    if (isClosed) closedCount++;
    else activeCount++;

    if (isDeadlinePast && !isClosed) {
      expiredDeadlineButNotClosed.push(doc);
    }
    if (isEventPast && !isClosed) {
      expiredEventButNotClosed.push(doc);
    }
    if (!isClosed) {
      activeDocs.push(doc);
    }
  }

  console.log(`Expired registrationDeadline (< now): ${expiredDeadlineCount}`);
  console.log(`Expired eventDate (< now): ${expiredEventCount}`);
  console.log(`Status == 'Closed': ${closedCount}`);
  console.log(`Status != 'Closed' (Active): ${activeCount}`);

  console.log(`\nActive Documents (Total ${activeDocs.length}):`);
  activeDocs.forEach((doc, idx) => {
    console.log(`\n[Active ${idx + 1}] _id: ${doc._id} | externalId: ${doc.externalId} | provider: ${doc.sourceProvider} | status: ${doc.status}`);
    console.log(`   title: "${doc.title}"`);
    console.log(`   registrationDeadline: ${doc.registrationDeadline ? doc.registrationDeadline.toISOString() : 'NULL'}`);
    console.log(`   eventDate: ${doc.eventDate ? doc.eventDate.toISOString() : 'NULL'}`);
    console.log(`   updatedAt: ${doc.updatedAt ? doc.updatedAt.toISOString() : 'NULL'}`);
    console.log(`   lastSyncedAt: ${doc.lastSyncedAt ? doc.lastSyncedAt.toISOString() : 'NULL'}`);
  });

  // Let's check updated timestamps of all 420 documents to see which documents were recently updated by updateMany
  const recentlyUpdated = await ExternalHackathon.find({}).sort({ updatedAt: -1 }).limit(10).lean();
  console.log('\n--- Top 10 Recently Updated External Hackathons ---');
  recentlyUpdated.forEach((doc, idx) => {
    console.log(`[Recent ${idx + 1}] _id: ${doc._id} | title: "${doc.title}" | deadline: ${doc.registrationDeadline} | event: ${doc.eventDate} | status: ${doc.status} | updatedAt: ${doc.updatedAt}`);
  });

  await mongoose.disconnect();
}

investigate().catch(console.error);
