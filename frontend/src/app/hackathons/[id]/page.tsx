'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { RegistrationStatusBadge } from '@/components/hackathon/RegistrationStatusBadge';
import { CountdownTimer } from '@/components/hackathon/CountdownTimer';
import { BookmarkButton } from '@/components/hackathon/BookmarkButton';
import { ShareButton } from '@/components/hackathon/ShareButton';
import { useBookmarks } from '@/hooks/useBookmarks';
import { Trophy, Calendar, Users, Globe, ExternalLink, Mail, Phone, MapPin, ChevronLeft, Ticket } from 'lucide-react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function HackathonDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { bookmarks, bookmarkHackathon, unbookmarkHackathon } = useBookmarks();

  useEffect(() => {
    if (!id) return;
    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await api.get(`/hackathons/${id}`);
        setHackathon(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load hackathon details');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8 animate-pulse">
          <Skeleton className="h-[400px] w-full rounded-3xl" />
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
            <Skeleton className="h-24 w-64 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => <Skeleton key={n} className="h-24 rounded-xl" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !hackathon) {
    return (
      <MainLayout>
        <div className="pt-20">
          <EmptyState
            icon={Trophy}
            title="Hackathon Not Found"
            description={error || 'Unable to fetch details for this hackathon.'}
            action={
              <Link
                href="/hackathons"
                className="mt-6 inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Hackathons
              </Link>
            }
          />
        </div>
      </MainLayout>
    );
  }

  const isBookmarked = bookmarks.some((b) => (b.hackathon?._id || b.hackathon) === hackathon._id);

  const handleBookmarkToggle = async () => {
    if (isBookmarked) {
      await unbookmarkHackathon(hackathon._id);
    } else {
      await bookmarkHackathon(hackathon._id);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-12">
        <Link href="/hackathons" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Hackathons
        </Link>
        
        {/* Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-64 sm:h-[400px] w-full rounded-3xl overflow-hidden shadow-xl"
        >
          {hackathon.bannerImagePath || hackathon.image ? (
            <img
              src={
                (hackathon.bannerImagePath || hackathon.image).startsWith('http')
                  ? hackathon.bannerImagePath || hackathon.image
                  : `http://localhost:5000/${hackathon.bannerImagePath || hackathon.image}`
              }
              alt={hackathon.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/80 via-secondary/80 to-accent/80 text-white font-extrabold text-4xl px-6 text-center tracking-tight mix-blend-overlay">
              {hackathon.title}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <div className="absolute top-6 right-6 flex space-x-3">
            <div className="bg-background/40 backdrop-blur-md rounded-full shadow-lg hover:bg-background/60 transition-colors">
              <BookmarkButton isBookmarked={isBookmarked} onToggle={handleBookmarkToggle} />
            </div>
            <div className="bg-background/40 backdrop-blur-md rounded-full shadow-lg hover:bg-background/60 transition-colors">
              <ShareButton title={hackathon.title} />
            </div>
          </div>
          <div className="absolute bottom-6 left-6 right-6 md:hidden flex items-center gap-2">
            <RegistrationStatusBadge status={hackathon.status} deadline={hackathon.registrationDeadline} />
            {hackathon.source === 'external' ? (
              <span className="inline-flex items-center gap-1 bg-indigo-600/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                🌍 External
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                👤 Community
              </span>
            )}
          </div>
        </motion.div>

        {/* Header Info */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row items-start justify-between gap-6"
        >
          <div className="space-y-4 flex-1">
            <div className="hidden md:flex items-center space-x-3">
              <RegistrationStatusBadge status={hackathon.status} deadline={hackathon.registrationDeadline} />
              {hackathon.source === 'external' ? (
                <span className="inline-flex items-center gap-1 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  🌍 External {hackathon.externalId?.startsWith('unstop:') || hackathon.tags?.includes('Unstop') ? '• Unstop' : ''}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                  👤 Community
                </span>
              )}
              <Badge variant="secondary" className="px-3 py-1 uppercase tracking-wider">{hackathon.theme || 'General'}</Badge>
              {hackathon.difficulty && (
                <Badge variant="outline" className="px-3 py-1 uppercase tracking-wider text-muted-foreground border-border">{hackathon.difficulty}</Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">{hackathon.title}</h1>
            <p className="text-lg text-muted-foreground font-medium">Organized by <span className="text-foreground">{hackathon.organizer || 'TeamSync Community'}</span></p>
          </div>

          {hackathon.registrationDeadline && (
            <div className="self-stretch md:self-auto flex flex-col items-start md:items-end justify-center glass-card p-6 rounded-2xl border-primary/20 bg-primary/5">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Registration Closes In</span>
              <CountdownTimer targetDate={hackathon.registrationDeadline} />
            </div>
          )}
        </motion.div>

        {/* Grid Specs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-warning" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Prize Pool</div>
              <div className="text-lg font-bold text-foreground">
                {hackathon.prize ? `$${hackathon.prize.toLocaleString()}` : 'TBA'}
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Team Size</div>
              <div className="text-lg font-bold text-foreground">
                {hackathon.minTeamSize || 1} - {hackathon.maxTeamSize || 4} Members
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Registration Deadline</div>
              <div className="text-lg font-bold text-foreground">
                {hackathon.registrationDeadline
                  ? new Date(hackathon.registrationDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                  : 'TBA'}
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Mode</div>
              <div className="text-lg font-bold text-foreground">{hackathon.mode || 'Online'}</div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Registration Fee</div>
              <div className="text-lg font-bold text-foreground">
                {hackathon.registrationFeeType === 'free'
                  ? 'Free'
                  : hackathon.registrationFeeType === 'paid'
                  ? `${hackathon.currency === 'INR' ? '₹' : '$'}${hackathon.registrationFee || 'Paid'}`
                  : 'Not specified'}
              </div>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Eligibility</div>
              <div className="text-lg font-bold text-foreground capitalize">
                {hackathon.eligibilityType === 'college_students'
                  ? 'College Students'
                  : hackathon.eligibilityType === 'working_professionals'
                  ? 'Working Professionals'
                  : hackathon.eligibilityType === 'students'
                  ? 'Students'
                  : 'Open to Everyone'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Description & Links */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6"
        >
          <div className="lg:col-span-2 space-y-10">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <h3 className="text-2xl font-bold text-foreground mb-4 border-b pb-2 border-border">About Hackathon</h3>
              <p className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">
                {hackathon.description || 'No detailed description provided.'}
              </p>
            </div>

            {hackathon.requiredSkills && hackathon.requiredSkills.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-foreground mb-4">Required Skills</h3>
                <div className="flex flex-wrap gap-2.5">
                  {hackathon.requiredSkills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl space-y-6 sticky top-24">
              <h3 className="text-lg font-bold text-foreground">Actions & Links</h3>

              <div className="space-y-3">
                <Link
                  href={`/teams?hackathonId=${hackathon._id}`}
                  className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <Users className="w-4 h-4" />
                  <span>Find / Create Team</span>
                </Link>

                {(hackathon.officialWebsite || hackathon.officialUrl || hackathon.registrationLink) && (
                  <a
                    href={hackathon.officialWebsite || hackathon.officialUrl || hackathon.registrationLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl border border-input bg-background/50 text-foreground font-semibold hover:bg-accent transition-colors shadow-sm"
                  >
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span>Visit Official Website</span>
                    <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
                  </a>
                )}
              </div>

              {(hackathon.contactEmail || hackathon.contactPhone) && (
                <div className="pt-6 border-t border-border space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Contact Organizer</h4>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    {hackathon.contactEmail && (
                      <a href={`mailto:${hackathon.contactEmail}`} className="flex items-center space-x-3 hover:text-primary transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <span className="truncate">{hackathon.contactEmail}</span>
                      </a>
                    )}
                    {hackathon.contactPhone && (
                      <a href={`tel:${hackathon.contactPhone}`} className="flex items-center space-x-3 hover:text-primary transition-colors">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <span>{hackathon.contactPhone}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}
