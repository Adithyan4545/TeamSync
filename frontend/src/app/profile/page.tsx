'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { User, Mail, MapPin, Briefcase, Camera, Code, Trophy, Calendar, Globe, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ teams: 0, bookmarked: 0 });
  
  const [profile, setProfile] = useState<any>({
    name: '',
    role: 'student',
    college: '',
    department: '',
    year: '',
    bio: '',
    skills: [],
    github: '',
    twitter: '',
    linkedin: '',
    portfolio: '',
    achievements: [],
    projects: [],
    certificates: [],
    avatarUrl: ''
  });

  const [editForm, setEditForm] = useState<any>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const [res, teamsRes, bookmarksRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/teams?limit=1000').catch(() => ({ data: { items: [], data: [] } })),
          api.get('/bookmarks').catch(() => ({ data: [] }))
        ]);
        const data = res.data.data;
        
        const myTeams = (teamsRes.data?.items || teamsRes.data?.data || []).filter((t: any) => 
          t.leader?._id === data._id || t.leader === data._id || 
          (t.members && t.members.some((m: any) => m._id === data._id || m === data._id))
        );
        
        const bookmarksCount = Array.isArray(bookmarksRes.data) ? bookmarksRes.data.length : 0;
        
        setStats({ teams: myTeams.length, bookmarked: bookmarksCount });

        // Make sure fields are populated, even if missing from DB
        setProfile({
          ...data,
          name: data.name || '',
          role: data.role || 'student',
          bio: data.bio || '',
          skills: data.skills || [],
          github: data.github || '',
          twitter: data.twitter || '',
          linkedin: data.linkedin || '',
          portfolio: data.portfolio || '',
          college: data.college || '',
          department: data.department || '',
          year: data.year || '',
          achievements: data.achievements || [],
          projects: data.projects || [],
          certificates: data.certificates || [],
          avatarUrl: data.avatarUrl || ''
        });
        setEditForm(data);
      } catch (err: any) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const formData = new FormData();
      Object.keys(editForm).forEach(key => {
        if (key === 'skills' || key === 'certificates' || key === 'projects' || key === 'achievements') {
          formData.append(key, JSON.stringify(editForm[key]));
        } else if (editForm[key] !== null && editForm[key] !== undefined) {
          formData.append(key, editForm[key]);
        }
      });
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.put('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data.data);
      setIsEditing(false);
      setAvatarFile(null);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleInstantAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      if (!isEditing) {
        try {
          const formData = new FormData();
          formData.append('avatar', file);
          const res = await api.put('/users/me', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          setProfile(res.data.data);
          toast.success('Profile photo updated successfully');
        } catch (err: any) {
          toast.error('Failed to update profile photo');
        }
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto space-y-8 pb-10">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="md:col-span-2 h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-10">
        
        {/* Profile Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl overflow-hidden"
        >
          <div className="h-48 bg-gradient-to-r from-primary/80 via-secondary/80 to-accent/80 relative">
          </div>
          
          <div className="px-8 pb-8 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 -mt-16 sm:-mt-20 mb-6">
              <div className="flex items-end gap-6">
                <div className="relative group">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-background bg-muted flex items-center justify-center overflow-hidden shadow-xl">
                    {avatarFile ? (
                      <img src={URL.createObjectURL(avatarFile)} alt="" className="w-full h-full object-cover" />
                    ) : profile.avatarUrl && !avatarError ? (
                      <img 
                        src={profile.avatarUrl.startsWith('http') ? profile.avatarUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${profile.avatarUrl}`} 
                        alt="" 
                        className="w-full h-full object-cover" 
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <User className="w-16 h-16 text-muted-foreground opacity-50" />
                    )}
                  </div>
                  <label className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer transition-opacity ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <Camera className="w-8 h-8 text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleInstantAvatarUpload} />
                  </label>
                </div>
                
                <div className="pb-2">
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="text-3xl font-extrabold text-foreground bg-background border border-input rounded px-2 py-1 mb-1 w-full max-w-[250px]"
                      value={editForm.name} 
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})} 
                    />
                  ) : (
                    <h1 className="text-3xl font-extrabold text-foreground">{profile.name}</h1>
                  )}
                  <p className="text-lg text-muted-foreground font-medium flex items-center gap-2 mt-1 capitalize">
                    <Briefcase className="w-4 h-4" />
                    {profile.role}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                {isEditing ? (
                  <>
                    <Button 
                      variant="secondary"
                      onClick={() => { setIsEditing(false); setEditForm(profile); setAvatarFile(null); }}
                      className="flex-1 md:flex-none"
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={saving}
                      isLoading={saving}
                      className="flex-1 md:flex-none"
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="w-full md:w-auto"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column: About & Info */}
              <div className="md:col-span-2 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-3 border-b border-border pb-2">About Me</h3>
                  {isEditing ? (
                    <textarea 
                      className="w-full h-32 bg-background/50 border border-input rounded-xl p-4 text-sm focus:ring-2 focus:ring-ring focus:outline-none transition-shadow"
                      value={editForm.bio || ''}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base whitespace-pre-wrap">
                      {profile.bio || 'No bio provided yet.'}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4 border-b border-border pb-2 flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    Skills & Technologies
                  </h3>
                  <div className="flex flex-wrap gap-2.5">
                    {isEditing ? (
                      <div className="w-full">
                        <input 
                          type="text" 
                          placeholder="Type skills separated by commas (e.g. React, Node.js)" 
                          className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-ring"
                          value={editForm.skillsInput !== undefined ? editForm.skillsInput : (editForm.skills || []).join(', ')}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditForm({
                              ...editForm, 
                              skillsInput: val,
                              skills: val.split(',').map((s: string) => s.trim()).filter(Boolean)
                            });
                          }}
                        />
                      </div>
                    ) : (
                      profile.skills?.length > 0 ? profile.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                          {skill}
                        </Badge>
                      )) : <p className="text-sm text-muted-foreground">No skills added yet.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Trophy className="w-8 h-8 text-warning mb-2" />
                    <span className="text-2xl font-bold text-foreground">{stats.bookmarked}</span>
                    <span className="text-sm text-muted-foreground font-medium">Bookmarks</span>
                  </div>
                  <div className="glass-card p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Briefcase className="w-8 h-8 text-primary mb-2" />
                    <span className="text-2xl font-bold text-foreground">{stats.teams}</span>
                    <span className="text-sm text-muted-foreground font-medium">Teams Joined</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Contact & Socials */}
              <div className="space-y-6">
                <div className="glass-card p-5 rounded-2xl space-y-4">
                  <h3 className="font-bold text-foreground mb-2">Personal Info</h3>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-primary" />
                      </div>
                      {isEditing ? (
                        <input type="text" className="bg-background border border-input rounded px-2 py-1 flex-1" value={editForm.college || ''} onChange={e => setEditForm({...editForm, college: e.target.value})} placeholder="College/University" />
                      ) : (
                        <span className="font-medium">{profile.college || 'College not specified'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Code className="w-4 h-4 text-primary" />
                      </div>
                      {isEditing ? (
                        <input type="text" className="bg-background border border-input rounded px-2 py-1 flex-1" value={editForm.department || ''} onChange={e => setEditForm({...editForm, department: e.target.value})} placeholder="Department/Branch" />
                      ) : (
                        <span className="font-medium">{profile.department || 'Department not specified'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium truncate">{user?.email || profile.email}</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-5 rounded-2xl space-y-4">
                  <h3 className="font-bold text-foreground mb-2">Social Links</h3>
                  <div className="space-y-4 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 shrink-0 text-foreground" />
                      {isEditing ? (
                        <input type="text" placeholder="GitHub Username" className="bg-background border border-input rounded px-2 py-1 flex-1" value={editForm.github || ''} onChange={e => setEditForm({...editForm, github: e.target.value})} />
                      ) : (
                        profile.github ? <a href={`https://github.com/${profile.github}`} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors truncate">{profile.github}</a> : <span>No GitHub linked</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 shrink-0 text-[#0A66C2]" />
                      {isEditing ? (
                        <input type="text" placeholder="LinkedIn URL" className="bg-background border border-input rounded px-2 py-1 flex-1" value={editForm.linkedin || ''} onChange={e => setEditForm({...editForm, linkedin: e.target.value})} />
                      ) : (
                        profile.linkedin ? <a href={profile.linkedin.includes('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noreferrer" className="hover:text-[#0A66C2] transition-colors truncate">{profile.linkedin}</a> : <span>No LinkedIn linked</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 shrink-0 text-foreground" />
                      {isEditing ? (
                        <input type="text" placeholder="Portfolio URL" className="bg-background border border-input rounded px-2 py-1 flex-1" value={editForm.portfolio || ''} onChange={e => setEditForm({...editForm, portfolio: e.target.value})} />
                      ) : (
                        profile.portfolio ? <a href={profile.portfolio.includes('http') ? profile.portfolio : `https://${profile.portfolio}`} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors truncate">{profile.portfolio}</a> : <span>No Portfolio linked</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
}

