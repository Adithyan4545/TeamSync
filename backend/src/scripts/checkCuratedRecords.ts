import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ExternalHackathon } from '../models/ExternalHackathon';
import { syncExternalHackathons } from '../services/externalHackathonService';

async function inspectAndSync() {
  console.log('=== CHECKING EXTERNAL HACKATHON RECORDS ===');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log(`Connected to MongoDB: ${mongoUri}`);

  try {
    const totalCount = await ExternalHackathon.countDocuments();
    const allRecords = await ExternalHackathon.find().lean();

    const curatedIds = [
      'ext-google-cloud-genai-2026',
      'ext-ethglobal-ethsf-2026',
      'ext-mlh-global-hack-week-2026',
      'ext-hackmit-2026',
      'ext-devfolio-hackinout-2026',
      'ext-open-source-world-cup-2026',
    ];

    const curatedRecords = allRecords.filter(
      (r) => curatedIds.includes(r.externalId) || r.externalId.startsWith('ext-')
    );

    console.log(`Total External Hackathons in DB: ${totalCount}`);
    console.log(`Curated Mock Records count: ${curatedRecords.length}`);
    if (curatedRecords.length > 0) {
      console.log('Curated Records Details:');
      curatedRecords.forEach((r, idx) => {
        console.log(`  [${idx + 1}] ID: ${r._id} | externalId: "${r.externalId}" | title: "${r.title}" | source: "${r.source}"`);
      });
    }

    console.log('\n--- Running Sync with Curated & Devpost Disabled ---');
    const syncResult = await syncExternalHackathons();
    console.log('Sync Result:', syncResult);

    const postSyncCount = await ExternalHackathon.countDocuments();
    console.log(`Total External Hackathons after sync: ${postSyncCount}`);

  } catch (error) {
    console.error('Error during inspection:', error);
  } finally {
    await mongoose.disconnect();
  }
}

inspectAndSync();
