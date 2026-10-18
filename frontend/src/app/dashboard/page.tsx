'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { Skeleton } from '@/components/ui/Skeleton';
import { Trophy, Users, Star, ArrowUpRight, Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AIRecommendationsSection } from '@/components/dashboard/AIRecommendationsSection';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState({
    name: '',
    hackathons: 0,
    teams: 0,
    bookmarked: 0,
    notifications: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [meRes, hackathonsRes, teamsRes, notificationsRes, bookmarksRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/hackathons?limit=1000'),
          api.get('/teams?limit=1000'),
          api.get('/notifications'),
          api.get('/bookmarks')
        ]);
        
        const myProfile = meRes.data.data;
        const allHackathons = hackathonsRes.data.data || hackathonsRes.data.items || [];
        const myTeams = (teamsRes.data.items || teamsRes.data.data || []).filter((t: any) => 
          t.leader?._id === myProfile._id || t.leader === myProfile._id || 
          (t.members && t.members.some((m: any) => m._id === myProfile._id || m === myProfile._id))
        );
        const notifications = notificationsRes.data.data || [];

        const bookmarksCount = Array.isArray(bookmarksRes.data) ? bookmarksRes.data.length : 0;

        setData({
          name: myProfile.name,
          hackathons: allHackathons.length,
          teams: myTeams.length,
          bookmarked: bookmarksCount,
          notifications
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchDashboardData();
  }, [user]);

  if (loading) return (
    <MainLayout>
      <div className="space-y-8 p-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-64 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 p-8 glass-card rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/5"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest uppercase text-gradient drop-shadow-md">
              Welcome back, {data.name}!👋
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Here's what's happening in your hackathon journey today.
            </p>
          </div>
          <Link href="/hackathons" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm">
            Find Hackathons
            <ArrowUpRight className="w-4 h-4 ml-1.5" />
          </Link>
        </motion.div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Hackathons" 
            value={data.hackathons.toString()} 
            icon={<Trophy className="w-5 h-5 text-warning" />} 
            trend="Active on platform" 
            delay={0.1}
          />
          <StatCard 
            title="My Teams" 
            value={data.teams.toString()} 
            icon={<Users className="w-5 h-5 text-success" />} 
            trend="Joined or leading" 
            delay={0.2}
          />
          <StatCard 
            title="Bookmarked" 
            value={data.bookmarked.toString()} 
            icon={<Star className="w-5 h-5 text-primary" />} 
            trend="Saved for later" 
            delay={0.3}
          />
        </div>

        {/* Groq AI Recommendation Engine */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <AIRecommendationsSection />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <h3 className="text-xl font-bold text-foreground">Recent Activity</h3>
          <div className="glass-card rounded-2xl p-6 space-y-6 bg-background/50">
            {data.notifications.length === 0 ? (
              <div className="py-8 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Activity className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground">Your notifications will appear here</p>
              </div>
            ) : (
              data.notifications.slice(0, 5).map((activity: any, idx: number) => (
                <div key={activity._id || idx} className="flex items-start gap-4 group">
                  <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0 group-hover:scale-150 transition-transform" />
                  <div>
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{activity.message || 'Notification'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(activity.createdAt).toLocaleDateString()} at {new Date(activity.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}

function StatCard({ title, value, icon, trend, delay }: { title: string, value: string, icon: React.ReactNode, trend: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6 rounded-2xl flex flex-col justify-between h-full hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-sm font-semibold text-muted-foreground">{title}</div>
        <div className="p-2 rounded-xl bg-background/50">{icon}</div>
      </div>
      <div>
        <div className="text-3xl font-extrabold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground mt-1 font-medium">{trend}</div>
      </div>
    </motion.div>
  );
}

