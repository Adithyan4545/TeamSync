import { Router, Response } from 'express';
import { verifyAccessToken, AuthRequest } from '../middleware/authMiddleware';
import { User, UserRole } from '../models/User';
import { Team } from '../models/Team';
import { ExternalHackathon } from '../models/ExternalHackathon';
import { GroqService } from '../services/ai/GroqService';

const router = Router();

export interface AIMatchTeamResult {
  type: 'team';
  team: any;
  compatibilityScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  reason: string;
}

export interface AIMatchCandidateResult {
  type: 'student';
  student: any;
  compatibilityScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  reason: string;
}

/**
 * Deterministic AI-Powered Team Matching Endpoint
 * Single Source of Truth: MongoDB documents & mathematical skill overlap.
 */
router.get('/', verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const user = await User.findOne({ _id: userId, isDeleted: { $ne: true } }).lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const userSkills = (user.skills || []).map((s: string) => s.trim());
    const userSkillsLower = userSkills.map((s: string) => s.toLowerCase());

    // 1. STUDENT ROLE: Recommend Open Teams
    if (user.role === UserRole.STUDENT) {
      const rawTeams = await Team.find({ status: 'Open' })
        .populate('leader', 'name avatarUrl skills college')
        .populate('hackathon', 'title registrationDeadline')
        .lean();

      // Filter out duplicate teams if any and populate external hackathons if needed
      const openTeams: any[] = [];
      const seenTeamIds = new Set<string>();

      for (const t of rawTeams) {
        const teamIdStr = (t._id as any).toString();
        if (seenTeamIds.has(teamIdStr)) continue;
        seenTeamIds.add(teamIdStr);

        if (t.hackathon && typeof t.hackathon === 'object' && !(t.hackathon as any).title) {
          const extHack = await ExternalHackathon.findById(t.hackathon as any).lean();
          if (extHack) {
            (t as any).hackathon = { title: extHack.title, registrationDeadline: extHack.registrationDeadline };
          }
        }
        openTeams.push(t);
      }

      if (openTeams.length === 0) {
        return res.json({ success: true, data: [], message: 'No open teams currently available in MongoDB.' });
      }

      // Calculate Deterministic Match Scores
      const deterministicMatches: AIMatchTeamResult[] = openTeams.map((team) => {
        const requiredSkills: string[] = (team.requiredSkills || []).map((s: string) => s.trim());
        const matchingSkills = requiredSkills.filter((s) => userSkillsLower.includes(s.toLowerCase()));
        const missingSkills = requiredSkills.filter((s) => !userSkillsLower.includes(s.toLowerCase()));

        let compatibilityScore = 50;
        if (requiredSkills.length > 0) {
          compatibilityScore = Math.round((matchingSkills.length / requiredSkills.length) * 100);
        }

        const defaultReason = matchingSkills.length > 0
          ? `Matches ${matchingSkills.length} of ${requiredSkills.length} required skills: ${matchingSkills.join(', ')}.`
          : `Team ${team.name} is looking for active collaborators. Missing key skills: ${missingSkills.slice(0, 3).join(', ')}.`;

        return {
          type: 'team' as const,
          team,
          compatibilityScore,
          matchingSkills,
          missingSkills,
          reason: defaultReason,
        };
      }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      // Groq AI Explanation Generation (Optional enhancement for human-readable reasons)
      if (GroqService.isConfigured() && deterministicMatches.length > 0) {
        try {
          const topMatches = deterministicMatches.slice(0, 5);
          const groqInput = topMatches.map((m) => ({
            teamId: m.team._id.toString(),
            teamName: m.team.name,
            matchingSkills: m.matchingSkills,
            missingSkills: m.missingSkills,
            score: m.compatibilityScore,
          }));

          const systemPrompt = `You are TeamSync AI. Provide short, concise 1-sentence explanations of why each real team matches the candidate based on their skills. Return valid JSON: { "explanations": { "[teamId]": "string" } }`;
          const userPrompt = JSON.stringify({ candidateSkills: userSkills, teams: groqInput });

          const completionJson = await GroqService.generateCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ]);

          const parsed = JSON.parse(completionJson);
          if (parsed && parsed.explanations) {
            topMatches.forEach((m) => {
              const teamIdStr = m.team._id.toString();
              if (parsed.explanations[teamIdStr] && typeof parsed.explanations[teamIdStr] === 'string') {
                m.reason = parsed.explanations[teamIdStr];
              }
            });
          }
        } catch (err: any) {
          console.warn(`⚠️ [aiMatch] Groq explanation enhancement skipped: ${err.message}`);
        }
      }

      return res.json({ success: true, data: deterministicMatches });
    }

    // 2. LEADER / ADMIN ROLE: Recommend Candidates
    if (user.role === UserRole.LEADER || user.role === UserRole.ADMIN) {
      const myTeams = await Team.find({ leader: user._id }).lean();
      const requiredSkillsSet = new Set<string>();
      myTeams.forEach((t) => (t.requiredSkills || []).forEach((s) => requiredSkillsSet.add(s.trim())));
      const neededSkills = Array.from(requiredSkillsSet);
      const neededSkillsLower = neededSkills.map((s) => s.toLowerCase());

      const candidates = await User.find({
        role: UserRole.STUDENT,
        _id: { $ne: user._id },
        isDeleted: { $ne: true },
      })
        .select('-password -refreshTokens')
        .lean();

      if (candidates.length === 0) {
        return res.json({ success: true, data: [], message: 'No student candidates available.' });
      }

      const deterministicCandidateMatches: AIMatchCandidateResult[] = candidates.map((student) => {
        const studentSkills: string[] = (student.skills || []).map((s: string) => s.trim());
        const studentSkillsLower = studentSkills.map((s: string) => s.toLowerCase());

        const matchingSkills = studentSkills.filter((s) => neededSkillsLower.includes(s.toLowerCase()));
        const missingSkills = neededSkills.filter((s) => !studentSkillsLower.includes(s.toLowerCase()));

        let compatibilityScore = 50;
        if (neededSkills.length > 0) {
          compatibilityScore = Math.round((matchingSkills.length / neededSkills.length) * 100);
        }

        const defaultReason = matchingSkills.length > 0
          ? `Possesses ${matchingSkills.length} skills needed by your teams: ${matchingSkills.join(', ')}.`
          : `Active student available for team collaboration.`;

        return {
          type: 'student' as const,
          student,
          compatibilityScore,
          matchingSkills,
          missingSkills,
          reason: defaultReason,
        };
      }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      // Groq AI Explanation Generation
      if (GroqService.isConfigured() && deterministicCandidateMatches.length > 0) {
        try {
          const topCandidates = deterministicCandidateMatches.slice(0, 5);
          const groqInput = topCandidates.map((m) => ({
            candidateId: m.student._id.toString(),
            name: m.student.name,
            matchingSkills: m.matchingSkills,
            score: m.compatibilityScore,
          }));

          const systemPrompt = `You are TeamSync AI. Provide short, concise 1-sentence explanations for why each candidate fits the leader's teams. Return valid JSON: { "explanations": { "[candidateId]": "string" } }`;
          const userPrompt = JSON.stringify({ neededSkills, candidates: groqInput });

          const completionJson = await GroqService.generateCompletion([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ]);

          const parsed = JSON.parse(completionJson);
          if (parsed && parsed.explanations) {
            topCandidates.forEach((m) => {
              const candIdStr = m.student._id.toString();
              if (parsed.explanations[candIdStr] && typeof parsed.explanations[candIdStr] === 'string') {
                m.reason = parsed.explanations[candIdStr];
              }
            });
          }
        } catch (err: any) {
          console.warn(`⚠️ [aiMatch] Groq candidate explanation skipped: ${err.message}`);
        }
      }

      return res.json({ success: true, data: deterministicCandidateMatches });
    }

    return res.json({ success: true, data: [] });
  } catch (err: any) {
    console.error(`❌ [aiMatch] Error: ${err.message}`);
    res.status(500).json({ success: false, message: 'Failed to compute AI matches' });
  }
});

export default router;
