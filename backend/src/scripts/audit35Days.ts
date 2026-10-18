import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ExternalHackathon } from '../models/ExternalHackathon';
import { Hackathon } from '../models/Hackathon';
import { searchHackathons } from '../services/hackathonService';

async function audit35Days() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for 35-day audit');

  const now = new Date();
  const discoveryDays = Number(process.env.HACKATHON_DISCOVERY_DAYS) || 35;
  const windowEnd = new Date(now.getTime() + discoveryDays * 24 * 60 * 60 * 1000);

  console.log(`Now: ${now.toISOString()}`);
  console.log(`WindowEnd (+${discoveryDays}d): ${windowEnd.toISOString()}`);

  console.log('\n==================================================');
  console.log('SECTION 4: NULL DATE CATEGORY METRICS');
  console.log('==================================================');

  const noDeadlineNoEvent = await ExternalHackathon.countDocuments({
    registrationDeadline: null,
    eventDate: null,
  });

  const noDeadlineFutureEvent = await ExternalHackathon.countDocuments({
    registrationDeadline: null,
    eventDate: { $gte: now },
  });

  const noDeadlinePastEvent = await ExternalHackathon.countDocuments({
    registrationDeadline: null,
    eventDate: { $lt: now },
  });

  const futureDeadlineNoEvent = await ExternalHackathon.countDocuments({
    registrationDeadline: { $gte: now },
    eventDate: null,
  });

  const pastDeadlineNoEvent = await ExternalHackathon.countDocuments({
    registrationDeadline: { $lt: now },
    eventDate: null,
  });

  console.log(`No deadline + no event date: ${noDeadlineNoEvent}`);
  console.log(`No deadline + future event date: ${noDeadlineFutureEvent}`);
  console.log(`No deadline + past event date: ${noDeadlinePastEvent}`);
  console.log(`Future deadline + no event date: ${futureDeadlineNoEvent}`);
  console.log(`Past deadline + no event date: ${pastDeadlineNoEvent}`);

  console.log('\n==================================================');
  console.log('SECTION 5: 35-DAY ELIGIBILITY METRICS');
  console.log('==================================================');

  const totalExternal = await ExternalHackathon.countDocuments({});
  const openExternal = await ExternalHackathon.countDocuments({ status: { $ne: 'Closed' } });
  const closedExternal = await ExternalHackathon.countDocuments({ status: 'Closed' });

  // Query 35-day eligible via searchHackathons service
  const res35All = await searchHackathons({
    source: 'external',
    upcomingWindow: '35days',
    registrationFee: 'all',
    page: 1,
    limit: 1000,
  });

  const res35Free = await searchHackathons({
    source: 'external',
    upcomingWindow: '35days',
    registrationFee: 'free',
    page: 1,
    limit: 1000,
  });

  const res35Paid = await searchHackathons({
    source: 'external',
    upcomingWindow: '35days',
    registrationFee: 'paid',
    page: 1,
    limit: 1000,
  });

  const eligible35Count = res35All.total;
  const free35Count = res35Free.total;
  const paid35Count = res35Paid.total;

  // Unknown fee count among 35-day eligible
  const unknownFee35Count = res35All.items.filter(
    (item: any) => item.registrationFeeType === 'unknown' || (!item.registrationFeeType && !item.registrationFee)
  ).length;

  console.log(`Total external records: ${totalExternal}`);
  console.log(`Currently open for registration: ${openExternal}`);
  console.log(`Closed: ${closedExternal}`);
  console.log(`35-day eligible: ${eligible35Count}`);
  console.log(`35-day free: ${free35Count}`);
  console.log(`35-day paid: ${paid35Count}`);
  console.log(`Unknown fee: ${unknownFee35Count}`);

  console.log(`\nVerification checks:`);
  console.log(`35-day eligible <= currently open: ${eligible35Count <= openExternal} (${eligible35Count} <= ${openExternal})`);
  console.log(`free + paid + unknown == 35-day eligible: ${free35Count + paid35Count + unknownFee35Count === eligible35Count} (${free35Count} + ${paid35Count} + ${unknownFee35Count} = ${free35Count + paid35Count + unknownFee35Count})`);

  console.log('\n==================================================');
  console.log('SECTION 6: VERIFY PAGINATION');
  console.log('==================================================');

  const p1 = await searchHackathons({ source: 'external', upcomingWindow: '35days', page: 1, limit: 2, sortBy: 'deadline' });
  const p2 = await searchHackathons({ source: 'external', upcomingWindow: '35days', page: 2, limit: 2, sortBy: 'deadline' });
  const p3 = await searchHackathons({ source: 'external', upcomingWindow: '35days', page: 3, limit: 2, sortBy: 'deadline' });

  console.log(`Page 1 count: ${p1.items.length}, total: ${p1.total}`);
  console.log(`Page 2 count: ${p2.items.length}, total: ${p2.total}`);
  console.log(`Page 3 count: ${p3.items.length}, total: ${p3.total}`);

  const p1Ids = p1.items.map((i: any) => i._id.toString());
  const p2Ids = p2.items.map((i: any) => i._id.toString());
  const p3Ids = p3.items.map((i: any) => i._id.toString());

  console.log('Page 1 IDs:', p1Ids);
  console.log('Page 2 IDs:', p2Ids);
  console.log('Page 3 IDs:', p3Ids);

  const allIds = [...p1Ids, ...p2Ids, ...p3Ids];
  const uniqueIds = new Set(allIds);

  console.log(`Duplicates check: ${allIds.length === uniqueIds.size ? 'NO DUPLICATES ✅' : 'DUPLICATES FOUND ❌'}`);

  await mongoose.disconnect();
}

audit35Days().catch(console.error);
