import { Bookmark } from '../models/Bookmark';
import { Hackathon } from '../models/Hackathon';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { Types } from 'mongoose';

/** Service for managing bookmarks with real MongoDB validation & user isolation */
export const addHackathonBookmark = async (userId: Types.ObjectId, hackathonId: Types.ObjectId) => {
  // Validate real hackathon existence in MongoDB (Community or External)
  const existsInCommunity = await Hackathon.exists({ _id: hackathonId });
  const existsInExternal = await ExternalHackathon.exists({ _id: hackathonId });
  if (!existsInCommunity && !existsInExternal) {
    throw new Error('Invalid hackathon ID');
  }

  // Duplicate check
  const existing = await Bookmark.findOne({ user: userId, hackathon: hackathonId }).lean();
  if (existing) {
    throw new Error('Hackathon is already bookmarked');
  }

  const bookmark = new Bookmark({ user: userId, hackathon: hackathonId });
  return await bookmark.save();
};

export const removeHackathonBookmark = async (userId: Types.ObjectId, hackathonId: Types.ObjectId) => {
  // Non-destructive: removes ONLY the bookmark document for the user
  return await Bookmark.findOneAndDelete({ user: userId, hackathon: hackathonId }).lean();
};

export const deleteBookmarkById = async (bookmarkId: string, userId: string) => {
  const bookmark = await Bookmark.findById(bookmarkId);
  if (!bookmark) {
    return null;
  }
  if (bookmark.user.toString() !== userId) {
    throw new Error('Unauthorized access to another user\'s bookmark');
  }
  return await Bookmark.findByIdAndDelete(bookmarkId).lean();
};

export const addTeamBookmark = async (userId: Types.ObjectId, teamId: Types.ObjectId) => {
  const existing = await Bookmark.findOne({ user: userId, team: teamId }).lean();
  if (existing) {
    throw new Error('Team is already bookmarked');
  }
  const bookmark = new Bookmark({ user: userId, team: teamId });
  return await bookmark.save();
};

export const removeTeamBookmark = async (userId: Types.ObjectId, teamId: Types.ObjectId) => {
  return await Bookmark.findOneAndDelete({ user: userId, team: teamId }).lean();
};

export const listUserBookmarks = async (userId: Types.ObjectId) => {
  const rawBookmarks = await Bookmark.find({ user: userId }).populate('team').lean();
  const result = [];

  for (const b of rawBookmarks) {
    if (b.hackathon) {
      let hackathonObj: any = await Hackathon.findById(b.hackathon).lean();
      if (hackathonObj) {
        hackathonObj.source = 'community';
      } else {
        const extObj = await ExternalHackathon.findById(b.hackathon).lean();
        if (extObj) {
          hackathonObj = {
            ...extObj,
            bannerImagePath: extObj.image || (extObj as any).bannerImagePath,
            officialWebsite: extObj.officialUrl || (extObj as any).officialWebsite,
            source: 'external',
          };
        }
      }
      result.push({ ...b, hackathon: hackathonObj });
    } else {
      result.push(b);
    }
  }

  return result;
};
