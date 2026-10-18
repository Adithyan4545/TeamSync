import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { ExternalHackathon } from '../models/ExternalHackathon';
import { Hackathon } from '../models/Hackathon';
import { normalizeLocationDetails } from '../utils/locationNormalizer';

async function syncLocationDetails() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Location Normalization Sync\n');

  const externalRecords = await ExternalHackathon.find({});
  let updatedExternal = 0;

  for (const h of externalRecords) {
    const norm = normalizeLocationDetails(h.location, h.mode as any);
    h.locationDetails = norm;
    await h.save();
    updatedExternal++;
  }

  const communityRecords = await Hackathon.find({});
  let updatedCommunity = 0;

  for (const h of communityRecords) {
    const norm = normalizeLocationDetails(h.venue || 'Online', h.mode as any);
    h.locationDetails = norm;
    await h.save();
    updatedCommunity++;
  }

  console.log(`✅ Successfully normalized locationDetails for ${updatedExternal} External and ${updatedCommunity} Community hackathons.`);
  await mongoose.disconnect();
}

syncLocationDetails().catch(console.error);
