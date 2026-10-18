import React from 'react';
import { HackathonCard } from './HackathonCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

interface HackathonGridProps {
  hackathons: any[];
  bookmarks?: any[];
  onBookmarkToggle?: (hackathonId: string) => Promise<void>;
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

export const HackathonGrid: React.FC<HackathonGridProps> = ({
  hackathons,
  bookmarks = [],
  onBookmarkToggle,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <div key={n} className="flex flex-col space-y-3">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="space-y-2 p-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hackathons.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No hackathons found"
        description="Try adjusting your search query or filter settings to find what you're looking for."
      />
    );
  }

  const bookmarkedIds = new Set(bookmarks.map((b) => b.hackathon?._id || b.hackathon));

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
    >
      {hackathons.map((hackathon) => (
        <motion.div key={hackathon._id} variants={itemVariants}>
          <HackathonCard
            hackathon={hackathon}
            isBookmarked={bookmarkedIds.has(hackathon._id)}
            onBookmarkToggle={
              onBookmarkToggle ? () => onBookmarkToggle(hackathon._id) : undefined
            }
          />
        </motion.div>
      ))}
    </motion.div>
  );
};
