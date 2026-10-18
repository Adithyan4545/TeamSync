import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ExternalHackathon } from '../models/ExternalHackathon';

async function investigateReadOnly() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for READ-ONLY investigation');

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

  console.log(`Current Time (now): ${now.toISOString()}`);
  console.log(`Window End (+35d): ${windowEnd.toISOString()}\n`);

  const allDocs = await ExternalHackathon.find({}).lean();
  console.log(`Total External Records: ${allDocs.length}`);

  const providers = ['unstop', 'devfolio', 'hackerearth', 'mlh'];

  const providerStats: Record<string, any> = {};

  for (const prov of providers) {
    const provDocs = allDocs.filter(
      (d) => (d.sourceProvider || '').toLowerCase() === prov || (d.sourceProviders || []).map((sp) => sp.toLowerCase()).includes(prov)
    );

    let total = provDocs.length;
    let futureDeadline = 0;
    let futureEvent = 0;
    let missingDates = 0;
    let closedCount = 0;
    let currentlyOpen = 0;
    let eligible35 = 0;
    let historical = 0;

    for (const d of provDocs) {
      const regDate = d.registrationDeadline ? new Date(d.registrationDeadline) : null;
      const evtDate = d.eventDate ? new Date(d.eventDate) : null;

      if (!regDate && !evtDate) missingDates++;

      const isRegFuture = regDate ? regDate >= now : false;
      const isEvtFuture = evtDate ? evtDate >= now : false;

      if (isRegFuture) futureDeadline++;
      if (isEvtFuture) futureEvent++;

      const isClosed = d.status === 'Closed';
      if (isClosed) {
        closedCount++;
      } else {
        currentlyOpen++;
      }

      const isHistorical = (regDate && regDate < now) || (evtDate && evtDate < now) || isClosed;
      if (isHistorical) {
        historical++;
      }

      // Check 35-day eligibility
      const regNotPast = regDate ? regDate >= now : true;
      const evtNotPast = evtDate ? evtDate >= now : true;
      const isOpen = d.status !== 'Closed';

      const in35Window = (regDate && regDate >= now && regDate <= windowEnd) || (evtDate && evtDate >= now && evtDate <= windowEnd);

      if (isOpen && regNotPast && evtNotPast && in35Window) {
        eligible35++;
      }
    }

    providerStats[prov] = {
      total,
      futureDeadline,
      futureEvent,
      missingDates,
      closedCount,
      currentlyOpen,
      eligible35,
      historical,
    };
  }

  console.log('=====================================================================================================');
  console.log('PROVIDER-BY-PROVIDER BREAKDOWN TABLE');
  console.log('=====================================================================================================');
  console.log('Provider\t| Total\t| Future Deadline | Future Event | Currently Open | 35-Day Eligible | Historical');
  console.log('-----------------------------------------------------------------------------------------------------');
  for (const prov of providers) {
    const s = providerStats[prov];
    console.log(`${prov.toUpperCase()}\t| ${s.total}\t| ${s.futureDeadline}\t\t  | ${s.futureEvent}\t\t | ${s.currentlyOpen}\t\t  | ${s.eligible35}\t\t    | ${s.historical}`);
  }

  console.log('\n=====================================================================================================');
  console.log('DETAILED BREAKDOWN OF ALL 6 ACTIVE / OPEN HACKATHONS');
  console.log('=====================================================================================================');
  const activeDocs = allDocs.filter((d) => d.status !== 'Closed');
  activeDocs.forEach((doc, idx) => {
    const regDate = doc.registrationDeadline ? new Date(doc.registrationDeadline) : null;
    const evtDate = doc.eventDate ? new Date(doc.eventDate) : null;
    const in35 = (regDate && regDate >= now && regDate <= windowEnd) || (evtDate && evtDate >= now && evtDate <= windowEnd);

    console.log(`\n[Active Record ${idx + 1}] _id: ${doc._id}`);
    console.log(`   Title: "${doc.title}"`);
    console.log(`   Provider: ${doc.sourceProvider} | externalId: ${doc.externalId}`);
    console.log(`   registrationDeadline: ${doc.registrationDeadline ? doc.registrationDeadline.toISOString() : 'NULL'}`);
    console.log(`   eventDate: ${doc.eventDate ? doc.eventDate.toISOString() : 'NULL'}`);
    console.log(`   Fee Type: ${doc.registrationFeeType || 'unknown'}`);
    console.log(`   35-Day Eligible: ${in35 ? 'YES ✅' : 'NO ❌ (Reason: both deadline & event date > 35 days in future)'}`);
  });

  console.log('\n=====================================================================================================');
  console.log('SAMPLE HISTORICAL RECORDS BY PROVIDER');
  console.log('=====================================================================================================');
  for (const prov of providers) {
    const sampleHist = allDocs.find(
      (d) => ((d.sourceProvider || '').toLowerCase() === prov) && d.status === 'Closed'
    );
    if (sampleHist) {
      console.log(`\n[Sample Historical ${prov.toUpperCase()}] Title: "${sampleHist.title}"`);
      console.log(`   Deadline: ${sampleHist.registrationDeadline ? sampleHist.registrationDeadline.toISOString() : 'NULL'}`);
      console.log(`   EventDate: ${sampleHist.eventDate ? sampleHist.eventDate.toISOString() : 'NULL'}`);
      console.log(`   Created/Synced: ${sampleHist.createdAt ? sampleHist.createdAt.toISOString() : 'NULL'}`);
    }
  }

  await mongoose.disconnect();
}

investigateReadOnly().catch(console.error);
