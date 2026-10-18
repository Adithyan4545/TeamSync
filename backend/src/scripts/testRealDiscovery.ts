import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ExternalHackathon } from '../models/ExternalHackathon';
import { searchHackathons } from '../services/hackathonService';

async function testRealDiscovery() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Phase 9 & 10 Verification\n');

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  const allDocs = await ExternalHackathon.find({}).lean();
  console.log(`Total Stored External Records: ${allDocs.length}`);

  const providers = ['unstop', 'devfolio', 'hackerearth', 'mlh'];
  const providerTable: Record<string, any> = {};

  let totalOpen = 0;
  let totalUpcoming = 0;
  let totalOngoing = 0;
  let totalCompleted = 0;
  let totalRegOpen = 0;
  let totalRegClosed = 0;
  let totalRegUnknown = 0;
  let total35Eligible = 0;
  let totalFree = 0;
  let totalPaid = 0;
  let totalUnknownFee = 0;
  let fakeDateCount = 0;

  for (const prov of providers) {
    const provDocs = allDocs.filter(
      (d) => (d.sourceProvider || '').toLowerCase() === prov || (d.sourceProviders || []).map((sp) => sp.toLowerCase()).includes(prov)
    );

    let total = provDocs.length;
    let openCount = 0;
    let upcomingCount = 0;
    let ongoingCount = 0;
    let completedCount = 0;
    let eligible35 = 0;
    let historical = 0;

    for (const d of provDocs) {
      const regDate = d.registrationDeadline ? new Date(d.registrationDeadline) : null;
      const evtDate = d.eventDate ? new Date(d.eventDate) : null;

      // Check registration status
      if (regDate) {
        if (regDate >= now) totalRegOpen++;
        else totalRegClosed++;
      } else {
        totalRegUnknown++;
      }

      // Check event status
      if (evtDate) {
        if (evtDate > now) upcomingCount++;
        else completedCount++;
      }

      const isClosed = d.status === 'Closed';
      if (isClosed) {
        completedCount++;
        historical++;
      } else {
        openCount++;
      }

      // Check 35-day eligibility
      const isRegOpen = regDate ? regDate >= now : true;
      const isNotClosed = d.status !== 'Closed';
      const in35 = (regDate && regDate >= now && regDate <= windowEnd) || (evtDate && evtDate >= now && evtDate <= windowEnd);

      if (isNotClosed && isRegOpen && in35) {
        eligible35++;
        total35Eligible++;

        if (d.registrationFeeType === 'free') totalFree++;
        else if (d.registrationFeeType === 'paid') totalPaid++;
        else totalUnknownFee++;
      }
    }

    providerTable[prov] = {
      total,
      openCount,
      upcomingCount,
      eligible35,
      historical,
    };

    totalOpen += openCount;
    totalUpcoming += upcomingCount;
    totalCompleted += historical;
  }

  console.log('=====================================================================================================');
  console.log('PROVIDER-BY-PROVIDER VERIFICATION TABLE');
  console.log('=====================================================================================================');
  console.log('Provider\t| Total Stored | Current/Open | Upcoming | 35-Day Eligible | Historical');
  console.log('-----------------------------------------------------------------------------------------------------');
  for (const prov of providers) {
    const s = providerTable[prov];
    console.log(`${prov.toUpperCase()}\t| ${s.total}\t       | ${s.openCount}\t      | ${s.upcomingCount}\t | ${s.eligible35}\t\t   | ${s.historical}`);
  }

  console.log('\n=====================================================================================================');
  console.log('AGGREGATED SYSTEM METRICS REPORT');
  console.log('=====================================================================================================');
  console.log(`Total Stored Records: ${allDocs.length}`);
  console.log(`Currently Open / Active: ${totalOpen}`);
  console.log(`Closed / Historical: ${totalCompleted}`);
  console.log(`35-Day Eligible Records: ${total35Eligible}`);
  console.log(`35-Day Free: ${totalFree}`);
  console.log(`35-Day Paid: ${totalPaid}`);
  console.log(`Unknown Fee: ${totalUnknownFee}`);
  console.log(`Registration Open: ${totalRegOpen}`);
  console.log(`Registration Closed: ${totalRegClosed}`);
  console.log(`Registration Unknown: ${totalRegUnknown}`);

  // Test searchHackathons service pagination & 35-day window query
  console.log('\n=====================================================================================================');
  console.log('SEARCH SERVICE & PAGINATION TEST');
  console.log('=====================================================================================================');
  const search35 = await searchHackathons({ source: 'external', upcomingWindow: '35days', page: 1, limit: 12 });
  console.log(`searchHackathons 35-day query result total: ${search35.total}`);
  console.log(`Items on Page 1: ${search35.items.length}`);

  if (search35.items.length > 0) {
    console.log('\n--- Sample 35-Day Active Hackathons ---');
    search35.items.slice(0, 5).forEach((item: any, idx: number) => {
      console.log(`[${idx + 1}] Title: "${item.title}" | Provider: ${item.sourceProvider}`);
      console.log(`     Deadline: ${item.registrationDeadline} | EventDate: ${item.eventDate} | OfficialUrl: ${item.officialUrl}`);
    });
  }

  await mongoose.disconnect();
}

testRealDiscovery().catch(console.error);
