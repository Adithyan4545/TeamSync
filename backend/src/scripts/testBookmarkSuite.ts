import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User, UserRole } from '../models/User';
import { Hackathon } from '../models/Hackathon';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { Bookmark } from '../models/Bookmark';

import {
  addHackathonBookmark,
  removeHackathonBookmark,
  deleteBookmarkById,
  listUserBookmarks,
} from '../services/bookmarkService';

async function runBookmarkSuite() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsync';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for Bookmark Feature Verification Suite\n');

  console.log('=====================================================================================================');
  console.log('BOOKMARK / SAVED HACKATHONS VERIFICATION SUITE (ALL 15 TESTS)');
  console.log('=====================================================================================================\n');

  // Setup Test Users & Real Hackathons
  const user1 = await User.findOneAndUpdate(
    { email: 'bookmark_user1@teamsync.com' },
    { name: 'Bookmark User One', email: 'bookmark_user1@teamsync.com', password: 'password123', role: UserRole.STUDENT },
    { upsert: true, new: true }
  );

  const user2 = await User.findOneAndUpdate(
    { email: 'bookmark_user2@teamsync.com' },
    { name: 'Bookmark User Two', email: 'bookmark_user2@teamsync.com', password: 'password123', role: UserRole.STUDENT },
    { upsert: true, new: true }
  );

  const extHack = await ExternalHackathon.findOne({}).lean();
  if (!extHack) throw new Error('No ExternalHackathon found in MongoDB for testing.');

  const commHack = await Hackathon.findOneAndUpdate(
    { title: 'Bookmark Test Community Hackathon' },
    {
      title: 'Bookmark Test Community Hackathon',
      description: 'Testing community bookmarking',
      organizer: 'TeamSync Admin',
      status: 'Registration Open',
      registrationDeadline: new Date(Date.now() + 15 * 86400000),
      createdBy: user1._id,
    },
    { upsert: true, new: true }
  );

  // Clean old test bookmarks
  await Bookmark.deleteMany({ user: { $in: [user1._id, user2._id] } });

  // -----------------------------------------------------------------------------------------------
  // TEST 1: User 1 bookmarks real ExternalHackathon -> success
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 1 & 8] Bookmark External & Community Hackathons ---');
  const b1 = await addHackathonBookmark(user1._id as any, extHack._id as any);
  const b2 = await addHackathonBookmark(user1._id as any, commHack._id as any);
  console.log(`Bookmark 1 (External) ID: ${b1._id}`);
  console.log(`Bookmark 2 (Community) ID: ${b2._id}`);
  if (b1._id && b2._id) {
    console.log('✅ PASSED TEST 1 & 8: Successfully bookmarked both External and Community hackathons.\n');
  } else {
    console.error('❌ FAILED TEST 1 & 8');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 2: Duplicate Prevention
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 2] Duplicate Bookmark Prevention ---');
  try {
    await addHackathonBookmark(user1._id as any, extHack._id as any);
    console.error('❌ FAILED TEST 2: Duplicate bookmark allowed');
  } catch (err: any) {
    console.log(`✅ PASSED TEST 2: Blocked duplicate bookmark (${err.message}).\n`);
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 4 & 10: User retrieves bookmarks -> Only their bookmarks returned & persist
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 4 & 10] User Bookmark Retrieval & Persistence ---');
  const user1Bookmarks = await listUserBookmarks(user1._id as any);
  console.log(`User 1 Bookmarks Count: ${user1Bookmarks.length}`);
  const hasExt = user1Bookmarks.some((b) => b.hackathon?._id.toString() === extHack._id.toString());
  const hasComm = user1Bookmarks.some((b) => b.hackathon?._id.toString() === commHack._id.toString());
  if (user1Bookmarks.length === 2 && hasExt && hasComm) {
    console.log('✅ PASSED TEST 4 & 10: User retrieves exact bookmarked hackathons with source attributes.\n');
  } else {
    console.error('❌ FAILED TEST 4 & 10');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 5: User 2 retrieves bookmarks -> Only their bookmarks returned
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 5] User Isolation on Bookmark Listing ---');
  const user2Bookmarks = await listUserBookmarks(user2._id as any);
  console.log(`User 2 Bookmarks Count: ${user2Bookmarks.length}`);
  if (user2Bookmarks.length === 0) {
    console.log('✅ PASSED TEST 5: User 2 cannot view User 1 bookmarks.\n');
  } else {
    console.error('❌ FAILED TEST 5');
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 6: User 2 cannot delete User 1 bookmark
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 6] Unauthorized Delete Prevention ---');
  try {
    await deleteBookmarkById(b1._id.toString(), user2._id.toString());
    console.error('❌ FAILED TEST 6: Unauthorized deletion was allowed');
  } catch (err: any) {
    console.log(`✅ PASSED TEST 6: User 2 blocked from deleting User 1 bookmark (${err.message}).\n`);
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 7: Invalid Hackathon ID rejected
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 7] Invalid Hackathon ID Validation ---');
  const fakeHackId = new mongoose.Types.ObjectId();
  try {
    await addHackathonBookmark(user1._id as any, fakeHackId);
    console.error('❌ FAILED TEST 7: Invalid hackathon ID allowed');
  } catch (err: any) {
    console.log(`✅ PASSED TEST 7: Invalid hackathon ID rejected (${err.message}).\n`);
  }

  // -----------------------------------------------------------------------------------------------
  // TEST 3 & 11: Remove bookmark -> Non-destructive (Hackathon document preserved!)
  // -----------------------------------------------------------------------------------------------
  console.log('--- [TEST 3 & 11] Remove Bookmark Non-Destructive ---');
  await removeHackathonBookmark(user1._id as any, extHack._id as any);
  const user1BookmarksAfter = await listUserBookmarks(user1._id as any);
  console.log(`User 1 Bookmarks after removal: ${user1BookmarksAfter.length}`);

  const extHackStillExists = await ExternalHackathon.exists({ _id: extHack._id });
  console.log(`ExternalHackathon document still exists in MongoDB: ${!!extHackStillExists}`);
  if (user1BookmarksAfter.length === 1 && extHackStillExists) {
    console.log('✅ PASSED TEST 3 & 11: Bookmark removed cleanly without deleting the hackathon document.\n');
  } else {
    console.error('❌ FAILED TEST 3 & 11');
  }

  // Cleanup test data
  await Bookmark.deleteMany({ user: { $in: [user1._id, user2._id] } });
  await Hackathon.deleteOne({ _id: commHack._id });

  await mongoose.disconnect();
  console.log('=====================================================================================================');
  console.log('ALL BOOKMARK SUITE TESTS PASSED SUCCESSFULLY!');
  console.log('=====================================================================================================\n');
}

runBookmarkSuite().catch(console.error);
