'use client';

import React from 'react';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Trophy, Users, Star, ArrowRight, Lightbulb, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';

export const AIRecommendationsSection: React.FC = () => {
  const { recommendations, teamRecommendations, insights, isFallback, loading, refreshing, error, refresh } = useAIRecommendations();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const renderStars = (score: number) => {
    const starCount = Math.max(3, Math.min(5, Math.round((score / 100) * 5)));
    return (
      <div className="flex items-center space-x-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < starCount ? 'fill-amber-400 text-amber-400' : 'text-muted/40'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              Recommended for You
            </h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-xs font-bold px-2.5 py-0.5">
              Groq AI Powered
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Personalized hackathons and team matches tailored to your skill profile.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => refresh()}
          disabled={refreshing}
          className="shrink-0 rounded-xl border-border hover:bg-accent flex items-center gap-2 text-sm font-semibold"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-primary' : ''}`} />
          {refreshing ? 'Refreshing AI...' : 'Refresh AI Insights'}
        </Button>
      </div>

      {/* Fallback / Warning Banner if Groq API unavailable */}
      {(error || isFallback) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <span className="font-bold">Notice:</span> AI recommendations are operating in smart fallback mode. Configured Groq AI API key will activate live deep LLM recommendations.
          </div>
        </div>
      )}

      {/* AI Strategy Insights Pill */}
      {insights && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl glass-card border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-warning" /> AI Career Strategy
            </div>
            <p className="text-sm font-medium text-foreground leading-relaxed">{insights.summary}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge variant="outline" className="border-primary/30 text-primary font-bold px-3 py-1 text-xs">
              Role: {insights.recommendedRole}
            </Badge>
            <Badge variant="secondary" className="bg-primary/20 text-primary font-bold px-3 py-1 text-xs">
              Skill Focus: {insights.topSkillToLearn}
            </Badge>
          </div>
        </motion.div>
      )}

      {/* Top Hackathon Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" /> Top Recommended Hackathons
        </h3>

        {recommendations.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl text-muted-foreground text-sm">
            No hackathon recommendations available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.slice(0, 4).map((rec, idx) => (
              <motion.div
                key={rec.hackathon._id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group glass-card p-6 rounded-2xl border border-border hover:border-primary/40 transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {renderStars(rec.matchScore)}
                      <span className="text-xs font-semibold text-muted-foreground">({rec.matchScore}% Match)</span>
                    </div>
                    <Badge className="bg-primary text-primary-foreground font-black px-2.5 py-0.5 text-xs rounded-lg shadow-sm">
                      {rec.matchScore}%
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {rec.hackathon.source === 'external' ? '🌍 External' : '👤 Community'}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{rec.difficulty}</span>
                  </div>

                  <Link href={`/hackathons/${rec.hackathon._id}`} className="block group-hover:text-primary transition-colors">
                    <h4 className="text-xl font-bold text-foreground line-clamp-1">{rec.hackathon.title}</h4>
                  </Link>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{rec.reason}</p>

                  {/* Matched & Missing Skills */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Matched:
                      </span>
                      {rec.matchedSkills.map((skill, sIdx) => (
                        <Badge key={sIdx} variant="secondary" className="px-2 py-0 text-[11px] font-medium">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    {rec.missingSkills && rec.missingSkills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-semibold text-muted-foreground">Missing:</span>
                        {rec.missingSkills.map((skill, mIdx) => (
                          <Badge key={mIdx} variant="outline" className="px-2 py-0 text-[11px] text-muted-foreground border-border">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium truncate max-w-[200px]">
                    💡 {rec.learningValue}
                  </span>
                  <Link
                    href={`/hackathons/${rec.hackathon._id}`}
                    className="inline-flex items-center text-primary font-bold hover:underline shrink-0"
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Top Team Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Users className="w-5 h-5 text-success" /> Recommended Teams Seeking Teammates
        </h3>

        {teamRecommendations.length === 0 ? (
          <div className="p-8 text-center glass-card rounded-2xl text-muted-foreground text-sm">
            No open team recommendations available right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamRecommendations.slice(0, 4).map((rec, idx) => (
              <motion.div
                key={rec.team._id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
                className="group glass-card p-6 rounded-2xl border border-border hover:border-success/40 transition-all duration-300 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-success flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Team Compatibility
                    </span>
                    <Badge className="bg-success text-success-foreground font-black px-2.5 py-0.5 text-xs rounded-lg shadow-sm">
                      {rec.compatibilityScore}%
                    </Badge>
                  </div>

                  <Link href={`/teams/${rec.team._id}`} className="block group-hover:text-success transition-colors">
                    <h4 className="text-xl font-bold text-foreground line-clamp-1">{rec.team.name}</h4>
                  </Link>

                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{rec.explanation}</p>

                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-semibold text-foreground">Open Roles:</span>
                      {rec.teamNeeds.map((need, nIdx) => (
                        <Badge key={nIdx} variant="secondary" className="px-2 py-0 text-[11px] font-semibold bg-success/10 text-success">
                          {need}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="font-semibold text-foreground">Matched Skills:</span>
                      {rec.matchingSkills.map((skill, sIdx) => (
                        <Badge key={sIdx} variant="outline" className="px-2 py-0 text-[11px] font-medium border-border">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <Link
                    href={`/teams/${rec.team._id}`}
                    className="inline-flex items-center px-4 py-2 rounded-xl bg-success/10 text-success font-bold text-xs hover:bg-success hover:text-white transition-colors"
                  >
                    View Team & Apply <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
