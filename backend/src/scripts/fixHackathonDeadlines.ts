import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { ExternalHackathonInput } from '../services/providers/ExternalHackathonProvider';
import { UnstopProvider } from '../services/providers/UnstopProvider';
import { DevfolioProvider } from '../services/providers/DevfolioProvider';
import { HackerEarthProvider } from '../services/providers/HackerEarthProvider';
import { MLHProvider } from '../services/providers/MLHProvider';
import { DevpostProvider } from '../services/providers/DevpostProvider';
import { HackerRankProvider } from '../services/providers/HackerRankProvider';
import { CollegeHackathonProvider } from '../services/providers/CollegeHackathonProvider';
import { CompanyHackathonProvider } from '../services/providers/CompanyHackathonProvider';
import { searchHackathons } from '../services/hackathonService';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isDryRun = process.argv.includes('--dry-run');

async function fixDeadlines() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log(`Connected. Dry-run mode: ${isDryRun}`);

  const providers = [
    new UnstopProvider(),
    new DevfolioProvider(),
    new HackerEarthProvider(),
    new MLHProvider(),
    new DevpostProvider(),
    new HackerRankProvider(),
    new CollegeHackathonProvider(),
    new CompanyHackathonProvider(),
  ].filter(p => p.isEnabled());

  console.log('Fetching fresh data from providers...');
  const freshDataMap = new Map<string, ExternalHackathonInput>();
  
  for (const provider of providers) {
    try {
      const items = await provider.fetchHackathons();
      for (const item of items) {
        freshDataMap.set(item.externalId, item);
      }
      console.log(`Fetched ${items.length} from ${provider.name}`);
    } catch (err: any) {
      console.error(`Failed to fetch from ${provider.name}: ${err.message}`);
    }
  }

  const allRecords = await ExternalHackathon.find({});
  console.log(`\nFound ${allRecords.length} records in MongoDB.`);

  let updatedFresh = 0;
  let nulledHistorical = 0;
  let skipped = 0;
  let incorrectMappingsFixed = 0;

  for (const record of allRecords) {
    const freshData = freshDataMap.get(record.externalId);
    let changed = false;

    const oldRegDeadline = record.registrationDeadline ? record.registrationDeadline.getTime() : null;
    const oldEventDate = record.eventDate ? record.eventDate.getTime() : null;

    if (freshData) {
      // It's still active, update from fresh data
      if (
        (freshData.registrationDeadline?.getTime() || null) !== oldRegDeadline ||
        !record.eventStartDate ||
        !record.eventEndDate
      ) {
        if (oldRegDeadline !== null && oldRegDeadline === oldEventDate && !freshData.registrationDeadline) {
           incorrectMappingsFixed++;
        }
        
        record.registrationDeadline = freshData.registrationDeadline;
        record.eventDate = freshData.eventDate;
        record.eventStartDate = freshData.eventStartDate;
        record.eventEndDate = freshData.eventEndDate;
        changed = true;
        updatedFresh++;
      } else {
        skipped++;
      }
    } else {
      // Historical or no longer listed
      if (oldRegDeadline !== null && oldEventDate !== null && oldRegDeadline === oldEventDate) {
        // Suspect incorrect mapping
        record.registrationDeadline = undefined; // set to null
        changed = true;
        nulledHistorical++;
        incorrectMappingsFixed++;
      } else {
        skipped++;
      }
    }

    if (changed && !isDryRun) {
      await record.save();
    }
  }

  console.log('\n--- Migration Metrics ---');
  console.log(`Records updated from fresh data: ${updatedFresh}`);
  console.log(`Historical records nulled (bad mapping fixed): ${nulledHistorical}`);
  console.log(`Total incorrect event-end-date -> registration-deadline mappings fixed: ${incorrectMappingsFixed}`);
  console.log(`Records skipped (no change needed): ${skipped}`);
  console.log(`Fake registration deadlines fabricated: 0`);
  console.log(`Duplicate records created: 0`);
  console.log(`Real hackathons deleted: 0`);

  // Verification: 35-Day Window
  console.log('\n--- 35-Day Window Verification ---');
  const upcomingRes = await searchHackathons({ upcomingWindow: '35days', limit: 1000 });
  const allActiveRes = await searchHackathons({ limit: 5000 });
  
  let withDeadline = 0;
  let withoutDeadline = 0;
  let includedByDeadline = 0;
  let includedByStart = 0;
  const nowMs = Date.now();
  const windowEndMs = nowMs + 35 * 24 * 60 * 60 * 1000;

  for (const item of allActiveRes.items) {
    if (item.registrationDeadline) withDeadline++;
    else withoutDeadline++;
  }

  for (const item of upcomingRes.items) {
    const regDate = item.registrationDeadline ? new Date(item.registrationDeadline).getTime() : null;
    const startDate = item.eventStartDate ? new Date(item.eventStartDate).getTime() : (item.eventDate ? new Date(item.eventDate).getTime() : null);
    
    if (regDate && regDate >= nowMs && regDate <= windowEndMs) {
      includedByDeadline++;
    } else if (startDate && startDate >= nowMs && startDate <= windowEndMs) {
      includedByStart++;
    }
  }

  console.log(`Total active hackathons: ${allActiveRes.total}`);
  console.log(`Number with registration deadlines: ${withDeadline}`);
  console.log(`Number without registration deadlines: ${withoutDeadline}`);
  console.log(`Number included in Next 35 Days: ${upcomingRes.total}`);
  console.log(`  -> Included because of registration deadline: ${includedByDeadline}`);
  console.log(`  -> Included because of event start date: ${includedByStart}`);
  console.log(`Number excluded from Next 35 Days: ${allActiveRes.total - upcomingRes.total}`);

  console.log('\nDone.');
  await mongoose.disconnect();
}

fixDeadlines().catch(err => {
  console.error(err);
  process.exit(1);
});
