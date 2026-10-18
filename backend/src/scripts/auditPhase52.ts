import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ExternalHackathon } from '../models/ExternalHackathon';
import { Hackathon } from '../models/Hackathon';

async function audit() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB:', mongoUri);

  const now = new Date();
  console.log('Current Date (now):', now.toISOString());

  console.log('\n==================================================');
  console.log('1. RECONCILE RECORD COUNTS (ExternalHackathon)');
  console.log('==================================================');

  const totalExternal = await ExternalHackathon.countDocuments({});
  const expiredRegCount = await ExternalHackathon.countDocuments({ registrationDeadline: { $lt: now } });
  const closedCount = await ExternalHackathon.countDocuments({ status: 'Closed' });
  const activeCount = await ExternalHackathon.countDocuments({ status: { $ne: 'Closed' } });

  console.log(`Total External Records: ${totalExternal}`);
  console.log(`registrationDeadline < now: ${expiredRegCount}`);
  console.log(`Status == 'Closed': ${closedCount}`);
  console.log(`Status != 'Closed': ${activeCount}`);
  console.log(`Closed + Active = ${closedCount + activeCount}`);
  console.log(`ExpiredReg + Active = ${expiredRegCount + activeCount}`);

  // Query: registrationDeadline < now AND status != "Closed"
  const discrepancyDocs = await ExternalHackathon.find({
    registrationDeadline: { $lt: now },
    status: { $ne: 'Closed' }
  }).lean();

  console.log(`\nDiscrepancy Query (registrationDeadline < now AND status != "Closed") Count: ${discrepancyDocs.length}`);
  discrepancyDocs.forEach((doc, idx) => {
    console.log(`\n--- Discrepancy Record ${idx + 1} ---`);
    console.log(`_id: ${doc._id}`);
    console.log(`title: ${doc.title}`);
    console.log(`sourceProvider: ${doc.sourceProvider}`);
    console.log(`registrationDeadline: ${doc.registrationDeadline}`);
    console.log(`eventDate: ${doc.eventDate}`);
    console.log(`status: ${doc.status}`);
    console.log(`externalId: ${doc.externalId}`);
  });

  console.log('\n==================================================');
  console.log('2. STATUS BREAKDOWN OF ALL EXTERNAL HACKATHONS');
  console.log('==================================================');
  const statusCounts = await ExternalHackathon.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  console.log('Status distribution:', statusCounts);

  console.log('\n==================================================');
  console.log('3. NULL DATE HANDLING ANALYSIS');
  console.log('==================================================');
  const noDeadlineNoEvent = await ExternalHackathon.countDocuments({ registrationDeadline: null, eventDate: null });
  const noDeadlineFutureEvent = await ExternalHackathon.countDocuments({ registrationDeadline: null, eventDate: { $gte: now } });
  const noDeadlinePastEvent = await ExternalHackathon.countDocuments({ registrationDeadline: null, eventDate: { $lt: now } });
  const futureDeadlineNoEvent = await ExternalHackathon.countDocuments({ registrationDeadline: { $gte: now }, eventDate: null });
  const pastDeadlineNoEvent = await ExternalHackathon.countDocuments({ registrationDeadline: { $lt: now }, eventDate: null });

  console.log(`No deadline + no event date: ${noDeadlineNoEvent}`);
  console.log(`No deadline + future event date: ${noDeadlineFutureEvent}`);
  console.log(`No deadline + past event date: ${noDeadlinePastEvent}`);
  console.log(`Future deadline + no event date: ${futureDeadlineNoEvent}`);
  console.log(`Past deadline + no event date: ${pastDeadlineNoEvent}`);

  console.log('\n==================================================');
  console.log('4. COMMUNITY HACKATHONS METRICS (for comparison)');
  console.log('==================================================');
  const totalCommunity = await Hackathon.countDocuments({});
  console.log(`Total Community Hackathons: ${totalCommunity}`);

  await mongoose.disconnect();
}

audit().catch(console.error);
