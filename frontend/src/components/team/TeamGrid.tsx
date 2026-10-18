import React from 'react';
import { TeamCard } from './TeamCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

interface TeamGridProps {
  teams: any[];
  userRequests?: any[];
  onSendRequest?: (teamId: string) => Promise<void>;
  onCancelRequest?: (teamId: string) => Promise<void>;
  loading?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export const TeamGrid: React.FC<TeamGridProps> = ({
  teams,
  userRequests = [],
  onSendRequest,
  onCancelRequest,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="flex flex-col space-y-4 p-5 glass-card rounded-2xl h-72">
            <div className="flex justify-between items-start">
              <div className="space-y-3 w-3/4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-6 w-full" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-16 w-full mt-2" />
            <div className="mt-auto space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between border-t border-border/50 pt-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No teams found"
        description="Try adjusting your search criteria or filters to find open teams."
      />
    );
  }

  const requestMap = new Map<string, string>();
  userRequests.forEach((req) => {
    const tId = typeof req.team === 'object' ? req.team._id : req.team;
    requestMap.set(tId, req.status);
  });

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      {teams.map((team) => (
        <motion.div key={team._id} variants={itemVariants} className="h-full">
          <TeamCard
            team={team}
            requestStatus={requestMap.get(team._id) as any}
            onSendRequest={onSendRequest ? () => onSendRequest(team._id) : undefined}
            onCancelRequest={onCancelRequest ? () => onCancelRequest(team._id) : undefined}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};
