import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ExternalHackathon } from '../models/ExternalHackathon';

async function traceDiscrepancyDocument() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);

  // Find documents where updatedAt was modified during the updateMany call on Aug 8, 2026 around 12:34:42
  // Or check documents where registrationDeadline < eventDate or registrationDeadline < Aug 8 2026
  const docsUpdatedByBatch = await ExternalHackathon.find({
    updatedAt: {
      $gte: new Date('2026-08-08T07:00:00.000Z'),
      $lte: new Date('2026-08-08T08:00:00.000Z'),
    }
  }).lean();

  console.log(`Documents updated during batch sync on Aug 8: ${docsUpdatedByBatch.length}`);

  // Let's print details of these documents
  docsUpdatedByBatch.forEach((doc, idx) => {
    console.log(`\n[Batch Updated ${idx + 1}]`);
    console.log(`_id: ${doc._id}`);
    console.log(`title: "${doc.title}"`);
    console.log(`sourceProvider: ${doc.sourceProvider}`);
    console.log(`externalId: ${doc.externalId}`);
    console.log(`registrationDeadline: ${doc.registrationDeadline}`);
    console.log(`eventDate: ${doc.eventDate}`);
    console.log(`status: ${doc.status}`);
    console.log(`createdAt: ${doc.createdAt}`);
    console.log(`updatedAt: ${doc.updatedAt}`);
  });

  // Let's also check if there are any documents where registrationDeadline < now AND eventDate > now or eventDate is null
  const deadlinePastEventFuture = await ExternalHackathon.find({
    registrationDeadline: { $lt: new Date() },
    $or: [{ eventDate: { $gt: new Date() } }, { eventDate: null }]
  }).lean();

  console.log(`\nDocuments where registrationDeadline < now AND (eventDate > now OR eventDate is null): ${deadlinePastEventFuture.length}`);
  deadlinePastEventFuture.forEach((doc, idx) => {
    console.log(`\n[DeadlinePast/EventFuture ${idx + 1}]`);
    console.log(`_id: ${doc._id}`);
    console.log(`title: "${doc.title}"`);
    console.log(`sourceProvider: ${doc.sourceProvider}`);
    console.log(`externalId: ${doc.externalId}`);
    console.log(`registrationDeadline: ${doc.registrationDeadline}`);
    console.log(`eventDate: ${doc.eventDate}`);
    console.log(`status: ${doc.status}`);
  });

  await mongoose.disconnect();
}

traceDiscrepancyDocument().catch(console.error);
