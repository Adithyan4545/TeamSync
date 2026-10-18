import React from 'react';
import Link from 'next/link';
import { RegistrationStatusBadge } from './RegistrationStatusBadge';
import { BookmarkButton } from './BookmarkButton';
import { ShareButton } from './ShareButton';
import { Calendar, Users, Trophy, ChevronRight, MapPin, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';

interface HackathonCardProps {
  hackathon: any;
  isBookmarked?: boolean;
  onBookmarkToggle?: () => Promise<void>;
}

export const HackathonCard: React.FC<HackathonCardProps> = ({
  hackathon,
  isBookmarked = false,
  onBookmarkToggle,
}) => {
  const city = hackathon.locationDetails?.city;
  const state = hackathon.locationDetails?.state;
  const hasPhysicalLoc = Boolean(city || state);

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group relative glass-card text-card-foreground flex flex-col h-full min-h-[480px] max-h-[560px]"
    >
      {/* Banner / Image */}
      <div className="relative h-40 w-full bg-gradient-to-br from-primary/80 via-secondary/80 to-accent/80 overflow-hidden shrink-0">
        {hackathon.bannerImagePath || hackathon.image ? (
          <img
            src={
              (hackathon.bannerImagePath || hackathon.image).startsWith('http')
                ? hackathon.bannerImagePath || hackathon.image
                : `http://localhost:5000/${hackathon.bannerImagePath || hackathon.image}`
            }
            alt={hackathon.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-extrabold text-2xl px-6 text-center tracking-tight mix-blend-overlay">
            {hackathon.title}
          </div>
        )}
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 flex-wrap">
          <RegistrationStatusBadge status={hackathon.status} deadline={hackathon.registrationDeadline} />
          {hackathon.source === 'external' ? (
            <span className="inline-flex items-center gap-1 bg-indigo-600/90 text-white backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm tracking-wide">
              {(() => {
                const pList = hackathon.sourceProviders || [hackathon.sourceProvider];
                const formatted: string[] = [];

                (Array.isArray(pList) ? pList : [pList]).forEach((p: string) => {
                  if (!p) return;
                  const pLower = String(p).toLowerCase();
                  if (pLower.includes('unstop') && !formatted.includes('Unstop')) formatted.push('Unstop');
                  else if (pLower.includes('devfolio') && !formatted.includes('Devfolio')) formatted.push('Devfolio');
                  else if (pLower.includes('hackerearth') && !formatted.includes('HackerEarth')) formatted.push('HackerEarth');
                  else if (pLower.includes('mlh') && !formatted.includes('MLH')) formatted.push('MLH');
                  else if (pLower.includes('devpost') && !formatted.includes('Devpost')) formatted.push('Devpost');
                  else if (pLower.includes('hackerrank') && !formatted.includes('HackerRank')) formatted.push('HackerRank');
                  else if (pLower.includes('college') && !formatted.includes('🏫 College')) formatted.push('🏫 College');
                  else if (pLower.includes('company') && !formatted.includes('🏢 Company')) formatted.push('🏢 Company');
                });

                if (formatted.length === 0) {
                  if (hackathon.sourceType === 'college') formatted.push('🏫 College');
                  else if (hackathon.sourceType === 'company') formatted.push('🏢 Company');
                  else formatted.push('Platform');
                }

                return formatted.some(f => f.includes('🏫') || f.includes('🏢')) 
                  ? formatted.join(' + ') 
                  : `🌍 ${formatted.join(' + ')}`;
              })()}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-emerald-600/90 text-white backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-sm tracking-wide">
              👤 Community
            </span>
          )}
          {typeof hackathon.matchScore === 'number' && (
            <span className="inline-flex items-center gap-1 bg-amber-500/90 text-black backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-extrabold shadow-sm tracking-wide">
              ⭐ {hackathon.matchScore}% Match
            </span>
          )}
        </div>
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          {onBookmarkToggle && (
            <div className="bg-background/40 backdrop-blur-md rounded-full shadow-sm hover:bg-background/60 transition-colors">
              <BookmarkButton isBookmarked={isBookmarked} onToggle={onBookmarkToggle} />
            </div>
          )}
          <div className="bg-background/40 backdrop-blur-md rounded-full shadow-sm hover:bg-background/60 transition-colors">
            <ShareButton title={hackathon.title} />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow justify-between overflow-hidden">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="px-2.5 py-0.5 text-[10px] uppercase tracking-wider">
              {hackathon.domains?.length ? hackathon.domains[0] : (hackathon.theme || 'General')}
            </Badge>
            {hackathon.eligibilityType && (
              <Badge variant="outline" className="px-2.5 py-0.5 text-[10px] font-semibold text-primary border-primary/30 bg-primary/5">
                {hackathon.eligibilityType === 'college_students'
                  ? '🎓 College Students'
                  : hackathon.eligibilityType === 'working_professionals'
                  ? '💼 Professionals'
                  : hackathon.eligibilityType === 'students'
                  ? '🎒 Students'
                  : '🌐 Open to All'}
              </Badge>
            )}

            {/* Location / Mode Badge */}
            {hackathon.mode === 'Offline' ? (
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                <MapPin className="w-3 h-3" />
                {hasPhysicalLoc ? `${city || ''}${city && state ? ', ' : ''}${state || ''}` : hackathon.location || 'Offline'}
              </span>
            ) : hackathon.mode === 'Hybrid' ? (
              <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                <Globe className="w-3 h-3" />
                {hasPhysicalLoc ? `${city || ''} • Hybrid` : 'Hybrid'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                <Globe className="w-3 h-3" /> Online
              </span>
            )}
          </div>
          <Link href={`/hackathons/${hackathon._id}`} className="block group/link">
            <h3 className="text-xl font-bold text-foreground group-hover/link:text-primary transition-colors line-clamp-1">
              {hackathon.title}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {hackathon.description || 'No description provided.'}
          </p>
        </div>

        {/* Details Grid */}
        <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-3 text-sm shrink-0">
          <div className="flex flex-col space-y-0.5">
            <span className="flex items-center text-muted-foreground text-xs font-medium">
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-warning" /> Prize Pool
            </span>
            <span className="font-semibold text-foreground">
              {hackathon.prize ? `$${hackathon.prize.toLocaleString()}` : 'TBA'}
            </span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="flex items-center text-muted-foreground text-xs font-medium">
              <Calendar className="w-3 h-3 mr-1 text-primary" /> Registration Deadline
            </span>
            <span className="font-semibold text-foreground">
              {hackathon.registrationDeadline
                ? new Date(hackathon.registrationDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : 'TBA'}
            </span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="flex items-center text-muted-foreground text-xs font-medium">
              <Users className="w-3 h-3 mr-1 text-success" /> Team
            </span>
            <span className="font-semibold text-foreground">
              {hackathon.minTeamSize || 1} - {hackathon.maxTeamSize || 4} Members
            </span>
          </div>

          <div className="flex flex-col space-y-0.5">
            <span className="flex items-center text-muted-foreground text-xs font-medium">
              🏷️ Entry Fee
            </span>
            <span className={`font-bold text-xs px-2 py-0.5 rounded-md w-fit ${
              hackathon.registrationFeeType === 'free'
                ? 'bg-emerald-500/10 text-emerald-500'
                : hackathon.registrationFeeType === 'paid'
                ? 'bg-amber-500/10 text-amber-500'
                : 'bg-muted text-muted-foreground'
            }`}>
              {hackathon.registrationFeeType === 'free'
                ? 'FREE'
                : hackathon.registrationFeeType === 'paid'
                ? `${hackathon.currency === 'INR' ? '₹' : '$'}${hackathon.registrationFee || 'Paid'}`
                : 'Not specified'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 shrink-0">
          <Link
            href={`/hackathons/${hackathon._id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors group/btn"
          >
            View Details
            <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
