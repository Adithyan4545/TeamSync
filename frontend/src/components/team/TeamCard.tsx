import React from 'react';
import Link from 'next/link';
import { Users, Code, ChevronRight, UserPlus } from 'lucide-react';
import { JoinRequestButton } from './JoinRequestButton';
import { Badge } from '@/components/ui/Badge';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

interface TeamCardProps {
  team: any;
  requestStatus?: 'Pending' | 'Accepted' | 'Rejected' | 'Shortlisted' | 'Leader' | null;
  onSendRequest?: () => Promise<void>;
  onCancelRequest?: () => Promise<void>;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  requestStatus,
  onSendRequest,
  onCancelRequest,
}) => {
  const { user } = useAuth();
  const currentUserId = ((user as any)?._id || (user as any)?.id)?.toString();

  const leaderId = (typeof team.leader === 'object' ? team.leader?._id : team.leader)?.toString();
  const isLeader = currentUserId && leaderId === currentUserId;
  const isMember = currentUserId && (team.members || []).some((m: any) => ((m._id || m)?.toString() === currentUserId));

  const computedStatus = isLeader ? 'Leader' : isMember ? 'Accepted' : requestStatus;

  const openPositions = Math.max(0, (team.maxMembers || 4) - (team.members?.length || 1));

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="group glass-card p-6 flex flex-col justify-between h-full"
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="space-y-2">
            <Badge 
              variant={team.status === 'Closed' || team.status === 'Full' ? 'destructive' : 'default'}
              className={team.status === 'Open' ? 'bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-none' : ''}
            >
              {team.status || 'Open'}
            </Badge>
            <Link href={`/teams/${team._id}`} className="block group/link">
              <h3 className="text-xl font-bold text-foreground group-hover/link:text-primary transition-colors line-clamp-1">
                {team.name}
              </h3>
            </Link>
          </div>
          {team.hackathon && (
            <Badge variant="outline" className="truncate max-w-[120px] shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground border-border">
              {typeof team.hackathon === 'object' ? team.hackathon.title : 'Hackathon'}
            </Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-5 leading-relaxed">
          {team.description || 'Looking for passionate teammates to build innovative solutions.'}
        </p>

        {/* Replacement Role Badge */}
        {team.openRoles && team.openRoles.length > 0 && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center space-x-2">
            <UserPlus className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div className="text-xs font-semibold text-amber-800 dark:text-amber-300 truncate">
              <span className="font-bold">Seeking:</span> {team.openRoles.join(', ')}
            </div>
          </div>
        )}

        {/* Required Skills */}
        {team.requiredSkills && team.requiredSkills.length > 0 && (
          <div className="mb-5">
            <div className="text-xs font-semibold text-foreground mb-2 flex items-center space-x-1.5 opacity-80">
              <Code className="w-3.5 h-3.5 text-primary" />
              <span>Required Skills</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {team.requiredSkills.slice(0, 4).map((skill: string, idx: number) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="px-2.5 py-0.5 text-xs font-medium"
                >
                  {skill}
                </Badge>
              ))}
              {team.requiredSkills.length > 4 && (
                <span className="text-xs font-medium text-muted-foreground self-center ml-1">
                  +{team.requiredSkills.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Details & Action */}
      <div className="pt-5 border-t border-border mt-auto">
        <div className="flex items-center justify-between text-sm mb-4">
          <span className="flex items-center space-x-1.5 text-muted-foreground font-medium">
            <Users className="w-4 h-4 text-success" />
            <span>
              {team.members?.length || 1}/{team.maxMembers || 4} Members
            </span>
          </span>
          <span className={`font-bold ${openPositions > 0 ? 'text-primary' : 'text-danger'}`}>
            {openPositions > 0 ? `${openPositions} Spot${openPositions > 1 ? 's' : ''} Left` : 'Full'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Link
            href={`/teams/${team._id}`}
            className="flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors group/view"
          >
            Details
            <ChevronRight className="w-3.5 h-3.5 ml-0.5 transition-transform group-hover/view:translate-x-1" />
          </Link>

          <JoinRequestButton
            status={computedStatus}
            onSend={onSendRequest || (async () => {})}
            onCancel={onCancelRequest || (async () => {})}
          />
        </div>
      </div>
    </motion.div>
  );
};
