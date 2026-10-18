import { User } from '../../models/User';
import { Hackathon } from '../../models/Hackathon';
import { ExternalHackathon } from '../../models/ExternalHackathon';
import { Team } from '../../models/Team';
import { GroqService } from './GroqService';

export interface HackathonRecommendation {
  hackathon: any;
  matchScore: number; // 0-100
  reason: string;
  matchedSkills: string[];
  missingSkills: string[];
  difficulty: string;
  learningValue: string;
}

export interface TeamRecommendation {
  team: any;
  compatibilityScore: number; // 0-100
  matchingSkills: string[];
  missingSkills: string[];
  teamNeeds: string[];
  explanation: string;
}

interface UserAICacheEntry {
  timestamp: number;
  hackathons: HackathonRecommendation[];
  teams: TeamRecommendation[];
  insights: {
    summary: string;
    topSkillToLearn: string;
    recommendedRole: string;
  };
  isFallback: boolean;
  message?: string;
}

// In-Memory Cache (TTL: 30 minutes)
const userAICache = new Map<string, UserAICacheEntry>();
const CACHE_TTL_MS = 30 * 60 * 1000;

export const clearUserAICache = (userId?: string): void => {
  if (userId) {
    userAICache.delete(userId);
  } else {
    userAICache.clear();
  }
};

/**
 * Perform Intelligent Heuristic Fallback matching if Groq API is offline/unconfigured.
 */
const generateHeuristicRecommendations = (user: any, communityHackathons: any[], externalHackathons: any[], openTeams: any[]) => {
  const userSkills: string[] = (user.skills || []).map((s: string) => s.toLowerCase());

  // Combine hackathons
  const allHackathons = [
    ...communityHackathons.map((h) => ({ ...h, source: 'community' })),
    ...externalHackathons.map((h) => ({ ...h, bannerImagePath: h.image || h.bannerImagePath, officialWebsite: h.officialUrl || h.officialWebsite, source: 'external' })),
  ];

  const hackathonMatches: HackathonRecommendation[] = allHackathons.map((h) => {
    const required: string[] = (h.requiredSkills || h.tags || []).map((s: string) => s.toLowerCase());
    const matched = required.filter((s) => userSkills.includes(s));
    const missing = required.filter((s) => !userSkills.includes(s));

    let matchScore = 60;
    if (required.length > 0) {
      matchScore = Math.min(98, Math.max(50, Math.round((matched.length / required.length) * 40 + 55)));
    } else {
      matchScore = 80;
    }

    return {
      hackathon: h,
      matchScore,
      reason: matched.length > 0
        ? `Great match because you know: ${matched.slice(0, 3).join(', ')}.`
        : `Strong learning opportunity aligned with your profile in ${h.theme || 'General'}.`,
      matchedSkills: matched.length > 0 ? matched : userSkills.slice(0, 2),
      missingSkills: missing.length > 0 ? missing : ['Docker', 'CI/CD'],
      difficulty: h.difficulty || 'Intermediate',
      learningValue: `Enhance your profile by building scalable solutions for ${h.title}.`,
    };
  }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 6);

  const teamMatches: TeamRecommendation[] = openTeams.map((t) => {
    const reqSkills: string[] = (t.requiredSkills || []).map((s: string) => s.toLowerCase());
    const matched = reqSkills.filter((s) => userSkills.includes(s));
    const missing = reqSkills.filter((s) => !userSkills.includes(s));

    let compatibilityScore = 65;
    if (reqSkills.length > 0) {
      compatibilityScore = Math.min(98, Math.max(55, Math.round((matched.length / reqSkills.length) * 45 + 50)));
    }

    return {
      team: t,
      compatibilityScore,
      matchingSkills: matched.length > 0 ? matched : userSkills.slice(0, 2),
      missingSkills: missing.length > 0 ? missing : ['GraphQL'],
      teamNeeds: t.openRoles?.length ? t.openRoles : ['Full Stack Developer'],
      explanation: matched.length > 0
        ? `They need a ${t.openRoles?.[0] || 'Developer'}. Your ${matched.join(', ')} skills align with their stack.`
        : `Team ${t.name} is looking for active collaborators for upcoming challenges.`,
    };
  }).sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 6);

  return {
    hackathons: hackathonMatches,
    teams: teamMatches,
    insights: {
      summary: `You have ${userSkills.length} verified skills. Recommended focus on AI/Full-Stack team collaboration.`,
      topSkillToLearn: 'Cloud Architecture & Agentic Workflows',
      recommendedRole: 'Full Stack Engineer',
    },
    isFallback: true,
    message: 'AI recommendations are temporarily using fallback heuristic engine.',
  };
};

/**
 * Generate AI-driven Personalized Hackathon and Team Recommendations for a User.
 */
export const getUserAIRecommendations = async (userId: string, forceRefresh = false) => {
  const cached = userAICache.get(userId);
  if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }

  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');

  const communityHackathons = await Hackathon.find({ status: { $ne: 'Closed' } }).limit(10).lean();
  const externalHackathons = await ExternalHackathon.find({ status: { $ne: 'Closed' } }).limit(10).lean();
  const openTeams = await Team.find({ status: 'Open' }).populate('leader', 'name avatarUrl').populate('hackathon', 'title').limit(10).lean();

  if (!GroqService.isConfigured()) {
    const heuristic = generateHeuristicRecommendations(user, communityHackathons, externalHackathons, openTeams);
    const entry: UserAICacheEntry = { ...heuristic, timestamp: Date.now() };
    userAICache.set(userId, entry);
    return entry;
  }

  try {
    const allHackathons = [
      ...communityHackathons.map((h) => ({ id: h._id.toString(), title: h.title, description: h.description, tags: h.tags, mode: h.mode, difficulty: h.difficulty, source: 'community' })),
      ...externalHackathons.map((h) => ({ id: h._id.toString(), title: h.title, description: h.description, tags: h.tags, mode: h.mode, source: 'external' })),
    ];

    const allTeams = openTeams.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      openRoles: t.openRoles,
      requiredSkills: t.requiredSkills,
      hackathonTitle: (t.hackathon as any)?.title || 'Hackathon',
    }));

    const systemPrompt = `You are the Lead AI Career & Hackathon Strategist for TeamSync.
Analyze the user profile and output a strictly valid JSON object with personalized recommendations for hackathons and teams.
Return JSON with this exact structure:
{
  "hackathonRecommendations": [
    {
      "id": "string",
      "matchScore": number (0-100),
      "reason": "string",
      "matchedSkills": ["string"],
      "missingSkills": ["string"],
      "difficulty": "string",
      "learningValue": "string"
    }
  ],
  "teamRecommendations": [
    {
      "id": "string",
      "compatibilityScore": number (0-100),
      "matchingSkills": ["string"],
      "missingSkills": ["string"],
      "teamNeeds": ["string"],
      "explanation": "string"
    }
  ],
  "insights": {
    "summary": "string",
    "topSkillToLearn": "string",
    "recommendedRole": "string"
  }
}`;

    const userPrompt = JSON.stringify({
      userProfile: {
        name: user.name,
        skills: user.skills || [],
        college: user.college,
        year: user.year,
        bio: user.bio,
      },
      availableHackathons: allHackathons,
      availableTeams: allTeams,
    });

    const completion = await GroqService.generateCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const parsed = JSON.parse(completion);

    // Map AI output back to DB objects
    const hackathonMatches: HackathonRecommendation[] = (parsed.hackathonRecommendations || [])
      .map((item: any) => {
        const fullObj =
          communityHackathons.find((h) => h._id.toString() === item.id) ||
          externalHackathons.find((h) => h._id.toString() === item.id);
        if (!fullObj) return null;
        return {
          hackathon: {
            ...fullObj,
            bannerImagePath: (fullObj as any).image || (fullObj as any).bannerImagePath,
            officialWebsite: (fullObj as any).officialUrl || (fullObj as any).officialWebsite,
            source: (fullObj as any).source || ((fullObj as any).externalId ? 'external' : 'community'),
          },
          matchScore: item.matchScore || 85,
          reason: item.reason || 'Recommended based on your profile.',
          matchedSkills: item.matchedSkills || [],
          missingSkills: item.missingSkills || [],
          difficulty: item.difficulty || 'Intermediate',
          learningValue: item.learningValue || 'High learning potential.',
        };
      })
      .filter(Boolean);

    const teamMatches: TeamRecommendation[] = (parsed.teamRecommendations || [])
      .map((item: any) => {
        const fullObj = openTeams.find((t) => t._id.toString() === item.id);
        if (!fullObj) return null;
        return {
          team: fullObj,
          compatibilityScore: item.compatibilityScore || 80,
          matchingSkills: item.matchingSkills || [],
          missingSkills: item.missingSkills || [],
          teamNeeds: item.teamNeeds || fullObj.openRoles || [],
          explanation: item.explanation || 'Great match for your skill set.',
        };
      })
      .filter(Boolean);

    const resultEntry: UserAICacheEntry = {
      timestamp: Date.now(),
      hackathons: hackathonMatches.length > 0 ? hackathonMatches : generateHeuristicRecommendations(user, communityHackathons, externalHackathons, openTeams).hackathons,
      teams: teamMatches.length > 0 ? teamMatches : generateHeuristicRecommendations(user, communityHackathons, externalHackathons, openTeams).teams,
      insights: parsed.insights || {
        summary: 'Your skill profile aligns with high-impact Web3 & AI hackathons.',
        topSkillToLearn: 'Cloud Microservices',
        recommendedRole: 'Full Stack Engineer',
      },
      isFallback: false,
    };

    userAICache.set(userId, resultEntry);
    return resultEntry;
  } catch (err: any) {
    console.warn(`⚠️ [aiRecommendationService] Groq AI processing failed, switching to heuristic fallback: ${err.message}`);
    const fallback = generateHeuristicRecommendations(user, communityHackathons, externalHackathons, openTeams);
    const entry: UserAICacheEntry = { ...fallback, timestamp: Date.now() };
    userAICache.set(userId, entry);
    return entry;
  }
};
