import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ExternalHackathon } from '../models/ExternalHackathon';

async function findExactDiscrepancyRecord() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);

  const docs = await ExternalHackathon.find({}).lean();

  console.log(`Analyzing ${docs.length} records...`);

  // Find records where registrationDeadline is before eventDate
  const mismatchDocs: any[] = [];
  for (const doc of docs) {
    if (doc.registrationDeadline && doc.eventDate) {
      const reg = new Date(doc.registrationDeadline).getTime();
      const evt = new Date(doc.eventDate).getTime();
      if (reg !== evt) {
        mismatchDocs.push(doc);
      }
    }
  }

  console.log(`\nFound ${mismatchDocs.length} records where registrationDeadline != eventDate:`);
  mismatchDocs.forEach((doc, idx) => {
    console.log(`\n--- Mismatch Record ${idx + 1} ---`);
    console.log(`_id: ${doc._id}`);
    console.log(`title: "${doc.title}"`);
    console.log(`sourceProvider: ${doc.sourceProvider}`);
    console.log(`registrationDeadline: ${doc.registrationDeadline}`);
    console.log(`eventDate: ${doc.eventDate}`);
    console.log(`status: ${doc.status}`);
    console.log(`externalId: ${doc.externalId}`);
  });

  await mongoose.disconnect();
}

findExactDiscrepancyRecord().catch(console.error);
