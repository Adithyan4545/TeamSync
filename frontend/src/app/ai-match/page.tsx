'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useJoinRequests } from '@/hooks/useJoinRequests';
import api from '@/lib/axios';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Sparkles, Users, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AIRecommendationsSection } from '@/components/dashboard/AIRecommendationsSection';
import Link from 'next/link';

export default function AIMatchPage() {
  const { user } = useAuth();
  const { userRequests, sendRequest, cancelRequest } = useJoinRequests();
  
  const [profile, setProfile] = useState<any>(null);
  const [suggestedTeams, setSuggestedTeams] = useState<any[]>([]);
  const [suggestedMembers, setSuggestedMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [meRes, matchRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/ai-match')
        ]);
        
        const myProfile = meRes.data.data;
        setProfile(myProfile);

        const matches = matchRes.data.data || [];
        
        setSuggestedTeams(
          matches
            .filter((m: any) => m.type === 'team')
            .map((m: any) => ({
              ...m.team,
              compatibility: m.compatibilityScore,
              matchingSkills: m.matchingSkills || [],
              missingSkills: m.missingSkills || [],
              reason: m.reason,
            }))
        );

        setSuggestedMembers(
          matches
            .filter((m: any) => m.type === 'student')
            .map((m: any) => ({
              ...m.student,
              compatibility: m.compatibilityScore,
              matchingSkills: m.matchingSkills || [],
              missingSkills: m.missingSkills || [],
              reason: m.reason,
            }))
        );
      } catch (err: any) {
        toast.error('Failed to load AI matches');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (loading) return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="space-y-8 pb-12 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest uppercase text-gradient drop-shadow-md">
              AI Match & Career Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              Deterministic skill-matching powered by MongoDB and Groq AI reasoning.
            </p>
          </div>
        </div>

        {/* Groq AI Recommendation Engine */}
        <AIRecommendationsSection />

        <div className="pt-6 border-t border-border grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Suggested Teams */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Recommended Teams ({suggestedTeams.length})
            </h2>
            {suggestedTeams.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 border border-dashed border-border/50">
                <p className="text-muted-foreground text-center">No open team matches found at this time.</p>
              </div>
            ) : (
              suggestedTeams.map((team, idx) => {
                const userReq = userRequests.find(
                  (req) => (typeof req.team === 'object' ? req.team._id : req.team) === team._id
                );

                return (
                  <motion.div
                    key={team._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="glass-card rounded-2xl p-6 hover:shadow-md transition-shadow relative overflow-hidden group space-y-4 border border-border"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 mb-1 inline-block">
                          {team.status || 'Open'}
                        </span>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {team.name}
                        </h3>
                        {team.hackathon && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Target: <span className="font-semibold text-foreground">{typeof team.hackathon === 'object' ? team.hackathon.title : 'Hackathon'}</span>
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 text-sm">
                        {team.compatibility}% Match
                      </Badge>
                    </div>

                    {team.reason && (
                      <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl leading-relaxed italic border border-border/40">
                        🤖 AI Rationale: &ldquo;{team.reason}&rdquo;
                      </p>
                    )}

                    {/* Matching vs Missing Skills */}
                    <div className="space-y-2 text-xs">
                      {team.matchingSkills.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills:
                          </span>
                          {team.matchingSkills.map((skill: string) => (
                            <span key={skill} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {team.missingSkills.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Skill Gap:
                          </span>
                          {team.missingSkills.slice(0, 4).map((skill: string) => (
                            <span key={skill} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Link href={`/teams/${team._id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Team
                        </Button>
                      </Link>

                      {userReq ? (
                        <Button
                          variant="ghost"
                          className="flex-1 text-xs"
                          onClick={() => cancelRequest(team._id)}
                        >
                          Withdraw Request
                        </Button>
                      ) : (
                        <Button
                          className="flex-1"
                          onClick={() => sendRequest(team._id)}
                        >
                          Send Join Request
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>

          {/* Suggested Members */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-secondary" />
              Recommended Candidates ({suggestedMembers.length})
            </h2>
            {suggestedMembers.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 border border-dashed border-border/50">
                <p className="text-muted-foreground text-center">No student candidate matches found at this time.</p>
              </div>
            ) : (
              suggestedMembers.map((member, idx) => (
                <motion.div key={member._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + idx * 0.1 }} className="glass-card rounded-2xl p-6 hover:shadow-md transition-shadow flex flex-col gap-4 border border-border">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {member.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground truncate">{member.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{member.college || 'Student Candidate'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold px-3 py-1 text-sm">
                      {member.compatibility}% Match
                    </Badge>
                  </div>

                  {member.reason && (
                    <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl leading-relaxed italic border border-border/40">
                      🤖 AI Rationale: &ldquo;{member.reason}&rdquo;
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {member.skills?.slice(0, 5).map((skill: string) => (
                      <span key={skill} className="px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-primary font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <Link href="/profile">
                    <Button variant="outline" className="w-full text-xs">
                      View Profile
                    </Button>
                  </Link>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
