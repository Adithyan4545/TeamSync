'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { Bell, CheckCircle2, UserPlus, Trophy, AlertCircle, Clock, MoreHorizontal, Check, X, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

interface Notification {
  _id: string;
  type: 'join_request' | 'team_update' | 'hackathon_update' | 'system';
  payload: any;
  createdAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await api.get('/notifications?unread=false');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchNotifications();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
    await Promise.all(unreadIds.map(id => api.patch(`/notifications/${id}/read`)));
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/notifications/${id}`);
    setNotifications(notifications.filter(n => n._id !== id));
  };

  const filteredNotifications = notifications.filter(n => filter === 'all' ? true : !n.read);

  const handleRequestStatus = async (notificationId: string, requestId: string, status: 'Accepted' | 'Rejected') => {
    try {
      await api.patch(`/join-requests/${requestId}/status`, { status });
      await handleMarkRead(notificationId);
      import('react-hot-toast').then(mod => mod.toast.success(`Request ${status.toLowerCase()}!`));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to update request';
      await handleMarkRead(notificationId);
      if (errorMsg === 'Join request not found') {
        import('react-hot-toast').then(mod => mod.toast.error('This request has already been processed or cancelled.'));
      } else {
        import('react-hot-toast').then(mod => mod.toast.error(errorMsg));
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'JoinRequestSent':
      case 'join_request': return <UserPlus className="w-5 h-5 text-primary" />;
      case 'hackathon_update': return <Trophy className="w-5 h-5 text-warning" />;
      case 'team_update': return <CheckCircle2 className="w-5 h-5 text-success" />;
      default: return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'JoinRequestSent':
      case 'join_request': return 'bg-primary/10';
      case 'hackathon_update': return 'bg-warning/10';
      case 'team_update': return 'bg-success/10';
      default: return 'bg-muted';
    }
  };

  if (loading) return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12 pt-8">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-primary/10 relative">
                <Bell className="w-6 h-6 text-primary" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest uppercase text-gradient drop-shadow-md">
                Notifications
              </h1>
            </div>
            <p className="mt-2 text-lg text-muted-foreground">
              Stay updated with your hackathons, teams, and requests.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleMarkAllRead}
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Mark all as read
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === 'all' 
                ? 'bg-foreground text-background' 
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
              filter === 'unread' 
                ? 'bg-foreground text-background' 
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === 'unread' ? 'bg-background text-foreground' : 'bg-primary text-primary-foreground'
              }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredNotifications.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="You're all caught up!"
                description="Check back later for new notifications."
              />
            ) : (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`glass-card p-5 md:p-6 rounded-2xl flex flex-col md:flex-row gap-5 transition-colors border-l-4 ${
                    !notification.read ? 'border-l-primary bg-primary/5' : 'border-l-transparent'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getIconBg(notification.type)}`}>
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className={`text-lg font-bold ${!notification.read ? 'text-foreground' : 'text-foreground/80 capitalize'}`}>
                        {notification.type.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                        <div className="relative group">
                          <button className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 mt-2 w-36 bg-popover border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
                            {!notification.read && (
                              <button 
                                onClick={() => handleMarkRead(notification._id)}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" /> Mark Read
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(notification._id)}
                              className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted text-destructive transition-colors flex items-center gap-2"
                            >
                              <X className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {notification.payload?.message || ((notification.type as string) === 'JoinRequestSent' || notification.type === 'join_request' ? 'Someone has requested to join your team.' : 'You have a new notification.')}
                    </p>
                    
                    {(notification.type as string) === 'JoinRequestSent' && notification.payload?.requestId && !notification.read && (
                      <div className="pt-2">
                        {notification.payload.userEmail && (
                          <div className="mb-3 p-3 bg-muted/50 rounded-xl space-y-2">
                            <p className="text-sm font-semibold text-foreground">Applicant Details:</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                              <span className="font-medium text-foreground">Email ID:</span> {notification.payload.userEmail}
                            </p>
                            <div className="flex items-center gap-3">
                              {notification.payload.userGithub && (
                                <a href={notification.payload.userGithub} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">GitHub</a>
                              )}
                              {notification.payload.userLinkedin && (
                                <a href={notification.payload.userLinkedin} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">LinkedIn</a>
                              )}
                              {notification.payload.userPortfolio && (
                                <a href={notification.payload.userPortfolio} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Portfolio</a>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => handleRequestStatus(notification._id, notification.payload.requestId, 'Accepted')}
                            className="px-4 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-semibold rounded-lg text-sm transition-colors"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleRequestStatus(notification._id, notification.payload.requestId, 'Rejected')}
                            className="px-4 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground font-semibold rounded-lg text-sm transition-colors"
                          >
                            Reject
                          </button>
                          {notification.payload.teamId && (
                            <a href={`/teams/${notification.payload.teamId}/dashboard`} className="px-4 py-1.5 bg-muted text-foreground hover:bg-muted/80 font-semibold rounded-lg text-sm transition-colors">
                              View Dashboard
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}
