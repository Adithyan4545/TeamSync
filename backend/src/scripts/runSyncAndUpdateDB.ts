import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { syncExternalHackathons } from '../services/externalHackathonService';

async function runSync() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB. Running full external sync...');

  const result = await syncExternalHackathons();
  console.log('\n--- Sync Result ---');
  console.log(`Synced: ${result.synced}`);
  console.log(`Updated: ${result.updated}`);
  console.log(`Closed: ${result.closed}`);
  console.log(`Providers Processed: ${result.providersProcessed.join(', ')}`);

  await mongoose.disconnect();
}

runSync().catch(console.error);
