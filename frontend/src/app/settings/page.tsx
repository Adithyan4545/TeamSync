'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useUI } from '@/context/UIContext';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { 
  User, Settings, Bell, Shield, Moon, Sun, Monitor, 
  Trash2, LogOut, Loader2, Save, Key, Globe, Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useUI();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Forms
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [preferences, setPreferences] = useState({ language: 'en', timezone: 'UTC', defaultDashboard: 'overview' });
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentAlerts: true,
    teamRequestAlerts: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/users/me');
        const data = res.data.data;
        setProfileForm({ name: data.name, email: data.email });
        if (data.preferences) setPreferences({ ...preferences, ...data.preferences });
        if (data.notificationSettings) setNotifications({ ...notifications, ...data.notificationSettings });
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchSettings();
  }, [user]);

  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      await api.put('/users/me', profileForm);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) return toast.error('Fill both fields');
    try {
      setSaving(true);
      await api.put('/users/me/password', passwordForm);
      toast.success('Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePreferences = async () => {
    try {
      setSaving(true);
      await api.put('/users/me/preferences', { preferences, notificationSettings: notifications });
      toast.success('Preferences updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete your account? This cannot be undone.')) return;
    try {
      await api.delete('/users/me');
      toast.success('Account deleted');
      logout();
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await api.post('/users/logout-all');
      toast.success('Logged out from all devices');
      logout();
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to logout');
    }
  };

  if (loading) return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12 h-full">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-full md:w-64 h-64 rounded-3xl shrink-0" />
          <Skeleton className="flex-1 min-h-[500px] rounded-3xl" />
        </div>
      </div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12 h-full">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest uppercase text-gradient drop-shadow-md">
              Settings
            </h1>
          </div>
          <p className="mt-2 text-lg text-muted-foreground">Manage your account, preferences, and security.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-64 shrink-0 space-y-1">
            {[
              { id: 'account', label: 'Account', icon: User },
              { id: 'appearance', label: 'Appearance', icon: Sun },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'preferences', label: 'Preferences', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 glass-card rounded-3xl p-8 min-h-[500px]">
            {activeTab === 'account' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4 text-foreground">Account Information</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Input 
                        label="Name"
                        value={profileForm.name}
                        onChange={e => setProfileForm({...profileForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Input 
                        type="email"
                        label="Email"
                        value={profileForm.email}
                        onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                      />
                    </div>
                    <Button 
                      onClick={handleUpdateProfile}
                      disabled={saving}
                      isLoading={saving}
                    >
                      {!saving && <Save className="w-4 h-4 mr-2" />}
                      Save Profile
                    </Button>
                  </div>
                </div>

                <div className="pt-8 border-t border-border">
                  <h2 className="text-xl font-bold mb-4 text-destructive">Danger Zone</h2>
                  <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data.</p>
                  <button 
                    onClick={handleDeleteAccount}
                    className="px-5 py-2 rounded-xl bg-destructive/10 text-destructive font-semibold flex items-center gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h2 className="text-xl font-bold mb-4 text-foreground">Theme Preferences</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                  {[
                    { id: 'light', label: 'Light', icon: Sun },
                    { id: 'dark', label: 'Dark', icon: Moon },
                    { id: 'system', label: 'System', icon: Monitor }
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id as any)}
                      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
                        theme === t.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <t.icon className={`w-8 h-8 ${theme === t.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="font-semibold text-foreground">{t.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h2 className="text-xl font-bold mb-6 text-foreground">Notification Settings</h2>
                <div className="space-y-4 max-w-md">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates via email' },
                    { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive push notifications in browser' },
                    { key: 'assignmentAlerts', label: 'Assignment Alerts', desc: 'Get notified on task updates' },
                    { key: 'teamRequestAlerts', label: 'Team Request Alerts', desc: 'Get notified when someone requests to join' }
                  ].map(notif => (
                    <div key={notif.key} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background/50">
                      <div>
                        <p className="font-semibold text-foreground">{notif.label}</p>
                        <p className="text-sm text-muted-foreground">{notif.desc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={(notifications as any)[notif.key]}
                          onChange={(e) => setNotifications({...notifications, [notif.key]: e.target.checked})}
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  ))}
                  <Button 
                    onClick={handleUpdatePreferences}
                    disabled={saving}
                    isLoading={saving}
                    className="mt-6"
                  >
                    {!saving && <Save className="w-4 h-4 mr-2" />}
                    Save Notifications
                  </Button>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-4 text-foreground">Change Password</h2>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <Input 
                        type="password"
                        label="Current Password"
                        value={passwordForm.currentPassword}
                        onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      />
                    </div>
                    <div>
                      <Input 
                        type="password"
                        label="New Password"
                        value={passwordForm.newPassword}
                        onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      />
                    </div>
                    <Button 
                      onClick={handleChangePassword}
                      disabled={saving}
                      isLoading={saving}
                    >
                      {!saving && <Key className="w-4 h-4 mr-2" />}
                      Update Password
                    </Button>
                  </div>
                </div>

                <div className="pt-8 border-t border-border">
                  <h2 className="text-xl font-bold mb-4 text-foreground">Active Sessions</h2>
                  <button 
                    onClick={handleLogoutAll}
                    className="px-5 py-2 rounded-xl bg-secondary text-secondary-foreground font-semibold flex items-center gap-2 hover:bg-secondary/80 transition-colors border border-border"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout from all devices
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'preferences' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <h2 className="text-xl font-bold mb-6 text-foreground">General Preferences</h2>
                <div className="space-y-6 max-w-md">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
                      <Globe className="w-4 h-4" /> Language
                    </label>
                    <select 
                      value={preferences.language}
                      onChange={e => setPreferences({...preferences, language: e.target.value})}
                      className="w-full bg-background text-foreground border border-input rounded-xl px-4 py-2"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2 text-foreground">
                      <Clock className="w-4 h-4" /> Timezone
                    </label>
                    <select 
                      value={preferences.timezone}
                      onChange={e => setPreferences({...preferences, timezone: e.target.value})}
                      className="w-full bg-background text-foreground border border-input rounded-xl px-4 py-2"
                    >
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                      <option value="PST">PST (Pacific Standard Time)</option>
                      <option value="IST">IST (Indian Standard Time)</option>
                    </select>
                  </div>
                  <Button 
                    onClick={handleUpdatePreferences}
                    disabled={saving}
                    isLoading={saving}
                  >
                    {!saving && <Save className="w-4 h-4 mr-2" />}
                    Save Preferences
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
