import { GroqService, GroqChatMessage } from './GroqService';
import { searchHackathons } from '../hackathonService';
import { Team } from '../../models/Team';
import { User } from '../../models/User';

export type ChatIntent = 'TEAM_SEARCH' | 'HACKATHON_SEARCH' | 'COMBINED' | 'HACKATHON_RECOMMENDATION';

export interface ChatMessageContext {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestPayload {
  message: string;
  conversationId?: string;
  contextHistory?: ChatMessageContext[];
}

export interface ChatResponsePayload {
  message: string;
  hackathons: any[];
  teams: any[];
  suggestions: string[];
  intent?: ChatIntent;
  isFallback?: boolean;
}

// In-memory per-user rate limit (max 20 requests per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (key: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60 * 1000 });
    return true;
  }

  if (entry.count >= 20) {
    return false;
  }

  entry.count++;
  return true;
};

export const handleAIChat = async (
  payload: ChatRequestPayload,
  userId?: string,
  clientIp: string = '127.0.0.1'
): Promise<ChatResponsePayload> => {
  const { message, contextHistory = [] } = payload;

  const rateLimitKey = userId || clientIp;
  if (!checkRateLimit(rateLimitKey)) {
    throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
  }

  if (!message || typeof message !== 'string' || message.trim() === '') {
    throw new Error('Message is required.');
  }

  // 1. Read User Profile if Authenticated
  let userProfile: any = null;
  if (userId) {
    userProfile = await User.findById(userId).select('name skills college year bio').lean();
  }

  // 2. Combine previous conversation context + current message to parse intent
  const fullText = (contextHistory.map((c) => c.content).join(' ') + ' ' + message).toLowerCase();

  const isTeamQuery = /\b(team|teams|teammate|teammates|join a team|find a team|need members|looking for members)\b/i.test(fullText);
  const isHackathonQuery = /\b(hackathon|hackathons|competition|event|events|buildathon|contest)\b/i.test(fullText);
  const isExplicitRecommendation = /\b(recommend|recommended|personalized|for me|best for my skills)\b/i.test(fullText);

  let intent: ChatIntent = 'HACKATHON_SEARCH';

  if (isTeamQuery && isHackathonQuery) {
    intent = 'COMBINED';
  } else if (isTeamQuery) {
    intent = 'TEAM_SEARCH';
  } else if (isExplicitRecommendation) {
    intent = 'HACKATHON_RECOMMENDATION';
  } else {
    intent = 'HACKATHON_SEARCH';
  }

  // 3. Query Database Strictly
  let realHackathons: any[] = [];
  let realTeams: any[] = [];

  // Query Hackathons only if intent requires hackathons
  if (intent === 'HACKATHON_SEARCH' || intent === 'COMBINED' || intent === 'HACKATHON_RECOMMENDATION') {
    let modeFilter: string | undefined = undefined;
    if (/\bonline\b/i.test(fullText)) modeFilter = 'Online';
    else if (/\boffline\b font-medium|\bin person\b/i.test(fullText)) modeFilter = 'Offline';

    let domainFilter: string | undefined = undefined;
    if (/\b(ai|ml|machine learning|artificial intelligence)\b/i.test(fullText)) domainFilter = 'AI/ML';
    else if (/\b(web|frontend|backend|fullstack)\b/i.test(fullText)) domainFilter = 'Web Development';
    else if (/\b(mobile|android|ios|flutter)\b/i.test(fullText)) domainFilter = 'Mobile Development';
    else if (/\b(blockchain|web3|ethereum|solidity)\b/i.test(fullText)) domainFilter = 'Blockchain';
    else if (/\b(cloud|aws|gcp|azure)\b/i.test(fullText)) domainFilter = 'Cloud';

    let feeFilter: 'all' | 'free' | 'paid' = 'all';
    if (/\bfree\b/i.test(fullText)) feeFilter = 'free';

    let qSearch: string | undefined = undefined;
    const cleanQuery = message
      .replace(/\b(find|show|me|a|team|teams|hackathon|hackathons|looking|for|join|open|in|with)\b/gi, ' ')
      .trim();
    if (cleanQuery.length > 2) {
      qSearch = cleanQuery;
    }

    const hackResults = await searchHackathons({
      q: qSearch,
      mode: modeFilter,
      domain: domainFilter,
      registrationFee: feeFilter,
      upcomingWindow: '35days',
      limit: 6,
      userId,
    });

    realHackathons = hackResults.items || [];
  }

  // Query Teams ONLY if intent requires teams
  if (intent === 'TEAM_SEARCH' || intent === 'COMBINED') {
    const teamFilter: any = { status: 'Open' };
    const requiredSkillsList: string[] = [];

    if (/\bpython\b/i.test(fullText)) requiredSkillsList.push('Python');
    if (/\breact\b/i.test(fullText)) requiredSkillsList.push('React');
    if (/\bnode\b/i.test(fullText)) requiredSkillsList.push('Node.js');
    if (/\bjava\b/i.test(fullText)) requiredSkillsList.push('Java');
    if (/\bcpp\b|\bc\+\+\b/i.test(fullText)) requiredSkillsList.push('C++');

    if (requiredSkillsList.length > 0) {
      teamFilter.requiredSkills = { $in: requiredSkillsList.map((s) => new RegExp(s, 'i')) };
    }

    realTeams = await Team.find(teamFilter)
      .populate('leader hackathon')
      .limit(4)
      .lean();
  }

  // Define default suggestions
  const defaultSuggestions = [
    'Find free AI/ML hackathons in the next 35 days',
    'Help me find a team looking for Python developers',
    'Show me upcoming web development hackathons',
  ];

  const teamSuggestions = [
    'Search teams looking for React developers',
    'Create your own team for an upcoming hackathon',
    'Find open teams in AI/ML hackathons',
  ];

  // 4. Strict Database Verification (Prevent Fake Candidates & Teams)
  const validHackathonIds = new Set(realHackathons.map((h) => (h._id ? h._id.toString() : h.id || h.externalId)));
  const validTeamIds = new Set(realTeams.map((t) => (t._id ? t._id.toString() : t.id)));

  // 5. Groq Rationale Synthesis
  if (GroqService.isConfigured()) {
    try {
      const systemPrompt = `You are TeamSync AI Assistant. Your task is to explain and present the database search results naturally to the student user.

CRITICAL INSTRUCTIONS:
1. INTENT CATEGORY DETECTED: "${intent}".
   - If intent is "TEAM_SEARCH": Focus EXCLUSIVELY on open teams. Do NOT talk about hackathons unless asked.
   - If intent is "HACKATHON_SEARCH" or "HACKATHON_RECOMMENDATION": Focus EXCLUSIVELY on hackathons. Do NOT talk about teams.
   - If intent is "COMBINED": Address both hackathons and open teams.
2. If NO teams exist for TEAM_SEARCH, state clearly: "I couldn't find any open teams matching your request right now." and suggest creating a new team or exploring hackathons.
3. Strict Grounding: Use ONLY the provided real database records. NEVER invent fake hackathons, teams, user names, or scores.
4. Keep response under 100 words. Be encouraging, precise, and professional.`;

      const userPrompt = `User Query: "${message}"

User Profile: ${userProfile ? JSON.stringify(userProfile) : 'Guest User'}

Real Database Hackathons (${realHackathons.length}):
${JSON.stringify(
  realHackathons.map((h) => ({
    id: h._id?.toString() || h.id || h.externalId,
    title: h.title,
    mode: h.mode,
    fee: h.registrationFeeType,
    deadline: h.registrationDeadline,
    matchScore: h.matchScore,
  }))
)}

Real Database Open Teams (${realTeams.length}):
${JSON.stringify(
  realTeams.map((t) => ({
    id: t._id?.toString() || t.id,
    name: t.name,
    requiredSkills: t.requiredSkills,
    openRoles: t.openRoles,
    members: t.members?.length,
    maxMembers: t.maxMembers,
  }))
)}

Generate a helpful assistant response explaining these findings.`;

      const groqMessages: GroqChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...contextHistory.slice(-4).map((c) => ({ role: c.role, content: c.content })),
        { role: 'user', content: userPrompt },
      ];

      const groqResponse = await GroqService.generateCompletion(groqMessages, {
        temperature: 0.3,
      });

      let matchedHackathons = realHackathons.filter((h) => {
        const id = h._id?.toString() || h.id || h.externalId;
        return validHackathonIds.has(id);
      });

      let matchedTeams = realTeams.filter((t) => {
        const id = t._id?.toString() || t.id;
        return validTeamIds.has(id);
      });

      const jsonMatch = groqResponse.match(/\{[\s\S]*\}/);
      let parsed: any = {};
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          // Plain text response
        }
      }

      const botMessage = parsed.message || groqResponse.replace(/```json[\s\S]*?```/g, '').trim();

      return {
        message: botMessage,
        intent,
        hackathons: (intent === 'TEAM_SEARCH') ? [] : matchedHackathons,
        teams: (intent === 'HACKATHON_SEARCH' || intent === 'HACKATHON_RECOMMENDATION') ? [] : matchedTeams,
        suggestions: intent === 'TEAM_SEARCH' && realTeams.length === 0 ? teamSuggestions : (parsed.suggestions?.length ? parsed.suggestions : defaultSuggestions.slice(0, 3)),
        isFallback: false,
      };
    } catch (err: any) {
      console.warn(`⚠️ [aiChatbotService] Groq reasoning failed (${err.message}). Using empirical fallback.`);
    }
  }

  // 6. Heuristic Fallback Mode (Groq unconfigured / offline / errored)
  let fallbackMsg = '';
  let returnHackathons: any[] = [];
  let returnTeams: any[] = [];
  let returnSuggestions = defaultSuggestions.slice(0, 3);

  if (intent === 'TEAM_SEARCH') {
    returnHackathons = [];
    if (realTeams.length > 0) {
      fallbackMsg = `I found ${realTeams.length} open team${realTeams.length > 1 ? 's' : ''} looking for members.`;
      returnTeams = realTeams.slice(0, 4);
    } else {
      fallbackMsg = "I couldn't find any open teams matching your request right now.";
      returnTeams = [];
      returnSuggestions = teamSuggestions;
    }
  } else if (intent === 'COMBINED') {
    fallbackMsg = `I found matching hackathons and teams in TeamSync.`;
    returnHackathons = realHackathons.slice(0, 6);
    returnTeams = realTeams.slice(0, 4);
  } else {
    returnTeams = [];
    if (realHackathons.length > 0) {
      fallbackMsg = `I found ${realHackathons.length} matching hackathon${realHackathons.length > 1 ? 's' : ''} in TeamSync database.`;
      returnHackathons = realHackathons.slice(0, 6);
    } else {
      fallbackMsg = `I couldn't find any hackathons matching those exact filters. Try broadening your search options!`;
      returnHackathons = [];
    }
  }

  return {
    message: fallbackMsg,
    intent,
    hackathons: returnHackathons,
    teams: returnTeams,
    suggestions: returnSuggestions,
    isFallback: true,
  };
};
