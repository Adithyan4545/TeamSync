'use client';

import React from 'react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { HackathonGrid } from '@/components/hackathon/HackathonGrid';
import { TeamGrid } from '@/components/team/TeamGrid';
import { useJoinRequests } from '@/hooks/useJoinRequests';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { Bookmark, Trophy, Users } from 'lucide-react';

export default function BookmarksPage() {
  const { bookmarks, loading, bookmarkHackathon, unbookmarkHackathon } = useBookmarks();
  const { userRequests, sendRequest, cancelRequest } = useJoinRequests();

  const savedHackathons = bookmarks
    .map((b) => b.hackathon)
    .filter((h) => h && typeof h === 'object');

  const savedTeams = bookmarks
    .map((b) => b.team)
    .filter((t) => t && typeof t === 'object');

  const handleBookmarkToggle = async (hackathonId: string) => {
    await unbookmarkHackathon(hackathonId);
  };

  const [activeTab, setActiveTab] = React.useState<'hackathons' | 'teams'>('hackathons');

  return (
    <MainLayout>
      <div className="space-y-8 pb-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2.5 rounded-xl bg-primary/10">
                 <Bookmark className="w-6 h-6 text-primary" />
               </div>
               <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest uppercase text-gradient drop-shadow-md">
                 My Bookmarks
               </h1>
             </div>
             <p className="mt-2 text-lg text-muted-foreground">
               View and manage your saved hackathons and teams in one place.
             </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-xl w-full max-w-sm">
          <button
            onClick={() => setActiveTab('hackathons')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'hackathons'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Hackathons</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-md bg-muted text-xs">{savedHackathons.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'teams'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teams</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-md bg-muted text-xs">{savedTeams.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'hackathons' ? (
            <HackathonGrid
              hackathons={savedHackathons}
              bookmarks={bookmarks}
              onBookmarkToggle={handleBookmarkToggle}
              loading={loading}
            />
          ) : (
            <TeamGrid
              teams={savedTeams}
              userRequests={userRequests}
              onSendRequest={sendRequest}
              onCancelRequest={cancelRequest}
              loading={loading}
            />
          )}
        </motion.div>
      </div>
    </MainLayout>
  );
}
