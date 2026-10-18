import { Hackathon, IHackathon } from '../models/Hackathon';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { Types } from 'mongoose';
import { getUserAIRecommendations } from './ai/aiRecommendationService';

/** Service for Hackathon CRUD, search, and stats across Community and External collections */
export const createHackathon = async (data: Partial<IHackathon>, adminId: Types.ObjectId) => {
  const hackathon = new Hackathon({ ...data, createdBy: adminId, source: 'community' });
  return await hackathon.save();
};

export const getHackathon = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    return null;
  }
  const communityItem = await Hackathon.findById(id).lean();
  if (communityItem) {
    return { ...communityItem, source: 'community' };
  }
  const externalItem = await ExternalHackathon.findById(id).lean();
  if (externalItem) {
    return {
      ...externalItem,
      bannerImagePath: externalItem.image || (externalItem as any).bannerImagePath,
      officialWebsite: externalItem.officialUrl || (externalItem as any).officialWebsite,
      source: 'external',
    };
  }
  return null;
};

export const updateHackathon = async (id: string, updates: Partial<IHackathon>) => {
  return await Hackathon.findByIdAndUpdate(id, updates, { new: true }).lean();
};

export const deleteHackathon = async (id: string) => {
  return await Hackathon.findByIdAndDelete(id).lean();
};

export interface SearchOptions {
  q?: string;
  theme?: string;
  difficulty?: string;
  mode?: string;
  status?: string;
  source?: 'all' | 'external' | 'community' | string;
  sourceProvider?: string;
  sourceType?: 'all' | 'platform' | 'college' | 'company' | 'community' | string;
  upcomingWindow?: 'all' | '35days';
  registrationFee?: 'all' | 'free' | 'paid';
  eligibility?: 'all' | 'students' | 'college_students' | 'working_professionals' | 'open_to_everyone';
  domain?: string | string[];
  state?: string;
  city?: string;
  country?: string;
  minPrize?: number;
  maxPrize?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  requiredSkills?: string[];
  tags?: string[];
  sortBy?: 'recommended' | 'deadline' | 'eventDate' | 'newest' | 'latest' | 'prize' | 'popularity';
  page?: number;
  limit?: number;
  userId?: string;
}

export const searchHackathons = async (options: SearchOptions) => {
  const {
    q, theme, difficulty, mode, status, source = 'all', sourceProvider, sourceType,
    upcomingWindow = 'all', registrationFee = 'all', eligibility = 'all', domain,
    state, city, country,
    minPrize, maxPrize, minTeamSize, maxTeamSize,
    requiredSkills, tags,
    sortBy = 'recommended', page = 1, limit = 12,
    userId,
  } = options;

  const domainList = domain ? (Array.isArray(domain) ? domain : [domain]).filter((d) => d && d !== 'all') : [];
  const discoveryDays = Number(process.env.HACKATHON_DISCOVERY_DAYS) || 35;
  const now = new Date();
  const windowEnd = new Date(now.getTime() + discoveryDays * 24 * 60 * 60 * 1000);

  const buildCommunityFilter = () => {
    const filter: any = {};
    if (q) filter.$or = [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }, { tags: new RegExp(q, 'i') }];
    if (theme) filter.theme = theme;
    if (difficulty) filter.difficulty = difficulty;
    if (mode && mode !== 'All') filter.mode = new RegExp(`^${mode}$`, 'i');
    if (status && status !== 'All') filter.status = status;

    if (state && state !== 'all' && state !== 'All India') {
      filter['locationDetails.state'] = new RegExp(`^${state.trim()}$`, 'i');
    }
    if (city && city !== 'all' && city !== 'All Cities') {
      filter['locationDetails.city'] = new RegExp(`^${city.trim()}$`, 'i');
    }
    if (country && country !== 'all') {
      filter['locationDetails.country'] = new RegExp(`^${country.trim()}$`, 'i');
    }

    if (upcomingWindow === '35days') {
      filter.status = { $ne: 'Closed' };
      const dateRange = [
        { registrationDeadline: { $gte: now, $lte: windowEnd } },
        { 
          eventStartDate: { $gte: now, $lte: windowEnd }, 
          registrationDeadline: { $not: { $lt: now } } 
        },
        { 
          eventDate: { $gte: now, $lte: windowEnd }, 
          registrationDeadline: { $not: { $lt: now } } 
        },
        { 
          startDate: { $gte: now, $lte: windowEnd }, 
          registrationDeadline: { $not: { $lt: now } } 
        },
      ];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: dateRange }];
        delete filter.$or;
      } else {
        filter.$or = dateRange;
      }
    }

    if (registrationFee === 'free') {
      filter.$or = filter.$or
        ? filter.$or
        : [{ registrationFeeType: 'free' }, { registrationFeeType: { $exists: false } }];
    } else if (registrationFee === 'paid') {
      filter.registrationFeeType = 'paid';
    }
    if (domainList.length > 0) {
      filter.tags = { $in: domainList.map((d) => new RegExp(d, 'i')) };
    }
    if (minPrize !== undefined || maxPrize !== undefined) {
      filter.prize = {};
      if (minPrize !== undefined) filter.prize.$gte = minPrize;
      if (maxPrize !== undefined) filter.prize.$lte = maxPrize;
    }
    if (minTeamSize !== undefined) filter.minTeamSize = { $gte: minTeamSize };
    if (maxTeamSize !== undefined) filter.maxTeamSize = { $lte: maxTeamSize };
    if (requiredSkills?.length) filter.requiredSkills = { $all: requiredSkills };
    if (tags?.length) filter.tags = { $all: tags };
    return filter;
  };

  const buildExternalFilter = () => {
    const filter: any = {};
    const qOr = q
      ? [{ title: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }, { tags: new RegExp(q, 'i') }, { organizer: new RegExp(q, 'i') }]
      : null;

    if (mode && mode !== 'All') filter.mode = new RegExp(`^${mode}$`, 'i');
    if (status && status !== 'All') filter.status = status;

    if (state && state !== 'all' && state !== 'All India') {
      filter['locationDetails.state'] = new RegExp(`^${state.trim()}$`, 'i');
    }
    if (city && city !== 'all' && city !== 'All Cities') {
      filter['locationDetails.city'] = new RegExp(`^${city.trim()}$`, 'i');
    }
    if (country && country !== 'all') {
      filter['locationDetails.country'] = new RegExp(`^${country.trim()}$`, 'i');
    }

    // Source Provider Filter
    const targetProvider = (sourceProvider || source || 'all').toLowerCase();
    if (!['all', 'external', 'community'].includes(targetProvider)) {
      filter.$or = [{ sourceProvider: targetProvider }, { sourceProviders: targetProvider }];
    }

    // Source Type Filter (platform, college, company, community)
    if (sourceType && sourceType !== 'all') {
      filter.sourceType = sourceType.toLowerCase();
    }

    if (upcomingWindow === '35days') {
      filter.status = { $ne: 'Closed' };
      const dateRange = [
        { registrationDeadline: { $gte: now, $lte: windowEnd } },
        { 
          eventStartDate: { $gte: now, $lte: windowEnd }, 
          registrationDeadline: { $not: { $lt: now } } 
        },
        { 
          eventDate: { $gte: now, $lte: windowEnd }, 
          registrationDeadline: { $not: { $lt: now } } 
        },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: dateRange }];
        delete filter.$or;
      } else {
        filter.$or = dateRange;
      }
    }

    if (qOr) {
      if (filter.$and) {
        filter.$and.push({ $or: qOr });
      } else if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: qOr }];
        delete filter.$or;
      } else {
        filter.$or = qOr;
      }
    }

    if (registrationFee === 'free') {
      filter.registrationFeeType = 'free';
    } else if (registrationFee === 'paid') {
      filter.registrationFeeType = 'paid';
    }
    if (eligibility && eligibility !== 'all') {
      filter.eligibilityType = eligibility;
    }
    if (domainList.length > 0) {
      filter.domains = { $in: domainList };
    }
    if (minPrize !== undefined || maxPrize !== undefined) {
      filter.prize = {};
      if (minPrize !== undefined) filter.prize.$gte = minPrize;
      if (maxPrize !== undefined) filter.prize.$lte = maxPrize;
    }
    if (tags?.length) filter.tags = { $all: tags };
    return filter;
  };

  let communityItems: any[] = [];
  let externalItems: any[] = [];

  const sourceVal = (source || 'all').toLowerCase();
  if ((sourceVal === 'all' || sourceVal === 'community') && !sourceProvider && (!sourceType || sourceType === 'all' || sourceType === 'community')) {
    communityItems = await Hackathon.find(buildCommunityFilter()).lean();
    communityItems = communityItems.map((item) => ({ ...item, source: 'community' }));
  }

  if (sourceVal !== 'community') {
    externalItems = await ExternalHackathon.find(buildExternalFilter()).lean();
    externalItems = externalItems.map((item) => ({
      ...item,
      bannerImagePath: item.image || item.bannerImagePath,
      officialWebsite: item.officialUrl || item.officialWebsite,
      source: 'external',
    }));
  }

  // Unified merge
  const allItems = [...communityItems, ...externalItems];

  // Fetch AI Recommendations if user logged in and sortBy === 'recommended'
  const aiScoreMap = new Map<string, number>();
  if (userId && (sortBy === 'recommended' || !sortBy)) {
    try {
      const aiRecs = await getUserAIRecommendations(userId);
      if (aiRecs && Array.isArray(aiRecs.hackathons)) {
        aiRecs.hackathons.forEach((rec: any) => {
          const hId = rec.hackathon?._id?.toString() || rec.hackathon?.id?.toString() || rec.hackathon?.externalId;
          if (hId && rec.matchScore) {
            aiScoreMap.set(hId, rec.matchScore);
          }
        });
      }
    } catch (err) {
      // Silently fall back if recommendation error
    }
  }

  const nowMs = Date.now();

  // Sorting
  allItems.sort((a, b) => {
    const idA = a._id?.toString() || a.id || a.externalId;
    const idB = b._id?.toString() || b.id || b.externalId;

    if (upcomingWindow === '35days') {
      const isClosedA = a.status === 'Closed' || (a.registrationDeadline && new Date(a.registrationDeadline).getTime() < nowMs);
      const isClosedB = b.status === 'Closed' || (b.registrationDeadline && new Date(b.registrationDeadline).getTime() < nowMs);

      if (isClosedA !== isClosedB) return isClosedA ? 1 : -1;

      const hasRegA = !!a.registrationDeadline;
      const hasRegB = !!b.registrationDeadline;

      if (hasRegA && !hasRegB) return -1;
      if (!hasRegA && hasRegB) return 1;

      if (hasRegA && hasRegB) {
        const dateA = new Date(a.registrationDeadline).getTime();
        const dateB = new Date(b.registrationDeadline).getTime();
        if (dateA !== dateB) return dateA - dateB;
      }

      const eventStartA = a.eventStartDate ? new Date(a.eventStartDate).getTime() : (a.eventDate ? new Date(a.eventDate).getTime() : Infinity);
      const eventStartB = b.eventStartDate ? new Date(b.eventStartDate).getTime() : (b.eventDate ? new Date(b.eventDate).getTime() : Infinity);
      return eventStartA - eventStartB;
    }

    if (sortBy === 'deadline') {
      const isClosedA = a.status === 'Closed' || (a.registrationDeadline && new Date(a.registrationDeadline).getTime() < nowMs);
      const isClosedB = b.status === 'Closed' || (b.registrationDeadline && new Date(b.registrationDeadline).getTime() < nowMs);

      if (isClosedA !== isClosedB) {
        return isClosedA ? 1 : -1;
      }

      const dateA = a.registrationDeadline ? new Date(a.registrationDeadline).getTime() : Infinity;
      const dateB = b.registrationDeadline ? new Date(b.registrationDeadline).getTime() : Infinity;
      return dateA - dateB;
    }

    if (sortBy === 'eventDate') {
      const isClosedA = a.status === 'Closed' || (a.registrationDeadline && new Date(a.registrationDeadline).getTime() < nowMs);
      const isClosedB = b.status === 'Closed' || (b.registrationDeadline && new Date(b.registrationDeadline).getTime() < nowMs);

      if (isClosedA !== isClosedB) {
        return isClosedA ? 1 : -1;
      }

      const dateA = a.eventDate ? new Date(a.eventDate).getTime() : (a.startDate ? new Date(a.startDate).getTime() : Infinity);
      const dateB = b.eventDate ? new Date(b.eventDate).getTime() : (b.startDate ? new Date(b.startDate).getTime() : Infinity);
      return dateA - dateB;
    }

    if (sortBy === 'newest' || sortBy === 'latest') {
      const timeA = (a.publishedAt ? new Date(a.publishedAt).getTime() : 0) ||
                    (a.createdAt ? new Date(a.createdAt).getTime() : 0) ||
                    (a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0) ||
                    (a.lastSynced ? new Date(a.lastSynced).getTime() : 0);
      const timeB = (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) ||
                    (b.createdAt ? new Date(b.createdAt).getTime() : 0) ||
                    (b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0) ||
                    (b.lastSynced ? new Date(b.lastSynced).getTime() : 0);
      return timeB - timeA;
    }

    if (sortBy === 'prize') {
      return (b.prize || 0) - (a.prize || 0);
    }

    if (sortBy === 'popularity') {
      return (b.popularityScore || 0) - (a.popularityScore || 0);
    }

    // Default 'recommended'
    if (userId && aiScoreMap.size > 0) {
      const scoreA = aiScoreMap.get(idA) || (a.popularityScore || 60);
      const scoreB = aiScoreMap.get(idB) || (b.popularityScore || 60);
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
    }

    const isClosedA = a.status === 'Closed' || (a.registrationDeadline && new Date(a.registrationDeadline).getTime() < nowMs);
    const isClosedB = b.status === 'Closed' || (b.registrationDeadline && new Date(b.registrationDeadline).getTime() < nowMs);

    if (isClosedA !== isClosedB) {
      return isClosedA ? 1 : -1;
    }

    const deadlineA = a.registrationDeadline ? new Date(a.registrationDeadline).getTime() : Infinity;
    const deadlineB = b.registrationDeadline ? new Date(b.registrationDeadline).getTime() : Infinity;

    if (deadlineA !== deadlineB) {
      return deadlineA - deadlineB;
    }

    const timeA = (a.publishedAt ? new Date(a.publishedAt).getTime() : 0) ||
                  (a.createdAt ? new Date(a.createdAt).getTime() : 0) ||
                  (a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0);
    const timeB = (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) ||
                  (b.createdAt ? new Date(b.createdAt).getTime() : 0) ||
                  (b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0);
    return timeB - timeA;
  });

  const total = allItems.length;
  const startIndex = (page - 1) * limit;
  const paginatedItems = allItems.slice(startIndex, startIndex + limit).map((item) => {
    const id = item._id?.toString() || item.id || item.externalId;
    if (userId && aiScoreMap.has(id)) {
      return { ...item, matchScore: aiScoreMap.get(id) };
    }
    return item;
  });

  return { total, page, limit, items: paginatedItems };
};

/** Get Available Location Options (States and Cities) from MongoDB */
export const getLocationOptionsService = async () => {
  const externalLocations = await ExternalHackathon.aggregate([
    { $match: { 'locationDetails.state': { $ne: null } } },
    {
      $group: {
        _id: { state: '$locationDetails.state', city: '$locationDetails.city' },
      },
    },
  ]);

  const communityLocations = await Hackathon.aggregate([
    { $match: { 'locationDetails.state': { $ne: null } } },
    {
      $group: {
        _id: { state: '$locationDetails.state', city: '$locationDetails.city' },
      },
    },
  ]);

  const combined = [...externalLocations, ...communityLocations];
  const stateSet = new Set<string>();
  const citiesMap: Record<string, Set<string>> = {};

  combined.forEach((item) => {
    const st = item._id?.state;
    const ct = item._id?.city;
    if (st) {
      stateSet.add(st);
      if (!citiesMap[st]) citiesMap[st] = new Set<string>();
      if (ct) citiesMap[st].add(ct);
    }
  });

  const states = Array.from(stateSet).sort();
  const cities: Record<string, string[]> = {};
  states.forEach((st) => {
    cities[st] = Array.from(citiesMap[st] || []).sort();
  });

  return { states, cities };
};

/** Get API Statistics for external hackathons */
export const getHackathonStats = async () => {
  const now = new Date();
  const discoveryDays = Number(process.env.HACKATHON_DISCOVERY_DAYS) || 35;
  const windowEnd = new Date(now.getTime() + discoveryDays * 24 * 60 * 60 * 1000);

  const totalExternal = await ExternalHackathon.countDocuments({ status: { $ne: 'Closed' } });

  const next35Days = await ExternalHackathon.countDocuments({
    status: { $ne: 'Closed' },
    $or: [
      { registrationDeadline: { $gte: now, $lte: windowEnd } },
      { eventDate: { $gte: now, $lte: windowEnd } },
    ],
  });

  const freeCount = await ExternalHackathon.countDocuments({
    status: { $ne: 'Closed' },
    registrationFeeType: 'free',
  });

  const paidCount = await ExternalHackathon.countDocuments({
    status: { $ne: 'Closed' },
    registrationFeeType: 'paid',
  });

  const aimlCount = await ExternalHackathon.countDocuments({
    status: { $ne: 'Closed' },
    domains: 'AI/ML',
  });

  const webDevCount = await ExternalHackathon.countDocuments({
    status: { $ne: 'Closed' },
    domains: 'Web Development',
  });

  const cybersecurityCount = await ExternalHackathon.countDocuments({
    status: { $ne: 'Closed' },
    domains: 'Cybersecurity',
  });

  const cloudCount = await ExternalHackathon.countDocuments({
    status: { $ne: 'Closed' },
    domains: 'Cloud',
  });

  const blockchainCount = await ExternalHackathon.countDocuments({
    status: { $ne: 'Closed' },
    domains: 'Blockchain',
  });

  return {
    totalExternal,
    next35Days,
    freeCount,
    paidCount,
    aimlCount,
    webDevCount,
    cybersecurityCount,
    cloudCount,
    blockchainCount,
  };
};
