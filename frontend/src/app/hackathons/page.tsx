'use client';

import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useHackathons, HackathonFilterParams } from '@/hooks/useHackathons';
import { useBookmarks } from '@/hooks/useBookmarks';
import { HackathonSearch } from '@/components/hackathon/HackathonSearch';
import { HackathonFilters } from '@/components/hackathon/HackathonFilters';
import { HackathonGrid } from '@/components/hackathon/HackathonGrid';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import api from '@/lib/axios';

function HackathonsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // SINGLE SOURCE OF TRUTH: Derive active filter params directly from URL searchParams
  const params = useMemo(() => {
    const p: HackathonFilterParams = {
      page: 1,
      limit: 12,
      upcomingWindow: '35days', // DEFAULT when upcomingWindow is omitted in URL
    };

    searchParams.forEach((val, key) => {
      if (val) {
        if (key === 'page' || key === 'limit' || key === 'minPrize' || key === 'maxPrize' || key === 'minTeamSize' || key === 'maxTeamSize') {
          p[key as keyof HackathonFilterParams] = Number(val) as any;
        } else if (key === 'upcomingWindow') {
          p.upcomingWindow = val === 'all' ? 'all' : '35days';
        } else {
          p[key as keyof HackathonFilterParams] = val as any;
        }
      }
    });

    return p;
  }, [searchParams]);

  const { hackathons, total, page, limit, loading } = useHackathons(params);
  const { bookmarks, bookmarkHackathon, unbookmarkHackathon } = useBookmarks();
  const [syncStatus, setSyncStatus] = React.useState<any>(null);

  React.useEffect(() => {
    api.get('/hackathons/sync-status')
      .then(res => {
        if (res.data && res.data.lastSync) {
          setSyncStatus(res.data);
        }
      })
      .catch(err => console.error('Failed to fetch sync status', err));
  }, []);

  // Helper to update URL searchParams cleanly without circular useEffect loops
  const updateUrlParams = (newFilters: Record<string, any>) => {
    const sp = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      // Don't delete 'all' for upcomingWindow since the default is '35days'
      if (value === undefined || value === null || value === '' || (value === 'all' && key !== 'upcomingWindow')) {
        sp.delete(key);
      } else {
        sp.set(key, String(value));
      }
    });

    const queryString = sp.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleSearchChange = (q: string) => {
    updateUrlParams({ q: q || undefined, page: 1 });
  };

  const handleSortChange = (sortBy: string) => {
    updateUrlParams({ sortBy: sortBy || undefined, page: 1 });
  };

  const handleFilterChange = (newFilters: any) => {
    updateUrlParams(newFilters);
  };

  const handleResetFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  const handleBookmarkToggle = async (hackathonId: string) => {
    const isBookmarked = bookmarks.some((b) => (b.hackathon?._id || b.hackathon) === hackathonId);
    if (isBookmarked) {
      await unbookmarkHackathon(hackathonId);
    } else {
      await bookmarkHackathon(hackathonId);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest uppercase text-gradient drop-shadow-md">
            Discover Hackathons
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-lg text-muted-foreground max-w-2xl">
              Explore upcoming, ongoing, and popular hackathons to build exciting projects and connect with top teams.
            </p>
            {syncStatus && (
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5 animate-pulse"></span>
                {syncStatus.totalActive} active • Last updated: {new Date(syncStatus.lastSync).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            )}
          </div>
        </div>
        <Link href="/hackathons/create">
          <Button className="shrink-0 bg-primary hover:bg-primary/90 text-white font-medium px-6 shadow-md shadow-primary/20">
            + Add Hackathon
          </Button>
        </Link>
      </motion.div>

      {/* Source Selector & Search & Sort */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Source Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-muted/60 backdrop-blur-md rounded-2xl w-fit border border-border">
          {[
            { id: 'all', label: 'All Hackathons', icon: '✨' },
            { id: 'external', label: '🌍 External', icon: '' },
            { id: 'community', label: '👤 Community', icon: '' },
          ].map((tab) => {
            const isActive = (params.source || 'all') === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => updateUrlParams({ source: tab.id === 'all' ? undefined : tab.id, page: 1 })}
                className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'bg-background text-foreground shadow-md border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <HackathonSearch
          value={params.q || ''}
          onChange={handleSearchChange}
          sortBy={params.sortBy || 'createdAt'}
          onSortChange={handleSortChange}
        />
      </motion.div>

      {/* Filters Toolbar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full"
      >
        <HackathonFilters
          filters={params}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />
      </motion.div>

      {/* Content Layout */}
      <div className="w-full">
        {/* Hackathon Grid */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full space-y-6"
        >
          <HackathonGrid
            hackathons={hackathons}
            bookmarks={bookmarks}
            onBookmarkToggle={handleBookmarkToggle}
            loading={loading}
          />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => updateUrlParams({ page: page - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm font-medium text-muted-foreground px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => updateUrlParams({ page: page + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function HackathonsPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading hackathons...</div>}>
        <HackathonsContent />
      </Suspense>
    </MainLayout>
  );
}
