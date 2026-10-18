'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useJoinRequests } from '@/hooks/useJoinRequests';
import { Users, Crown, UserMinus, Archive, RotateCcw, Check, X, Shield, Clock, Send, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function TeamDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', requiredSkills: '' });
  const [saving, setSaving] = useState(false);

  const { leaderRequests, updateStatus, refreshAll } = useJoinRequests();

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/teams/${id}`);
      setTeam(res.data);
      setEditForm({ 
        name: res.data.name || '', 
        description: res.data.description || '', 
        requiredSkills: (res.data.requiredSkills || []).join(', ') 
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load team dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTeam();
    }
  }, [id]);

  const handleDeleteTeam = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this team?')) return;
    try {
      await api.delete(`/teams/${id}`);
      toast.success('Team deleted successfully');
      router.push('/teams');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete team');
    }
  };

  const handleUpdateTeam = async () => {
    if (!editForm.name) return toast.error('Team name is required');
    try {
      setSaving(true);
      const skillsArray = editForm.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      await api.put(`/teams/${id}`, {
        name: editForm.name,
        description: editForm.description,
        requiredSkills: skillsArray
      });
      toast.success('Team updated successfully');
      setIsEditModalOpen(false);
      await fetchTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  const teamApplicants = leaderRequests.filter(
    (req) => (typeof req.team === 'object' ? req.team._id : req.team) === id
  );

  const handleArchive = async () => {
    await api.patch(`/teams/${id}/archive`);
    await fetchTeam();
  };

  const handleReopen = async () => {
    await api.patch(`/teams/${id}/reopen`);
    await fetchTeam();
  };

  const handleRemoveMember = async (memberId: string) => {
    await api.delete(`/teams/${id}/members/${memberId}`);
    await fetchTeam();
  };

  const handleTransferLeadership = async (newLeaderId: string) => {
    await api.patch(`/teams/${id}/transfer-leadership`, { newLeaderId });
    await fetchTeam();
  };

  const handleBulkStatus = async (status: 'Accepted' | 'Rejected') => {
    if (selectedRequests.length === 0) return;
    await api.post('/join-requests/bulk-status', { requestIds: selectedRequests, status });
    setSelectedRequests([]);
    await refreshAll();
    await fetchTeam();
  };

  const toggleSelect = (reqId: string) => {
    if (selectedRequests.includes(reqId)) {
      setSelectedRequests(selectedRequests.filter((i) => i !== reqId));
    } else {
      setSelectedRequests([...selectedRequests, reqId]);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-8">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !team) {
    return (
      <MainLayout>
        <div className="pt-20">
          <EmptyState
            icon={Shield}
            title="Dashboard Not Found"
            description={error || 'Team dashboard not found or you do not have permission.'}
            action={
              <Link href="/teams" className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                Back to Teams
              </Link>
            }
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
              Leader Dashboard
            </span>
            <span className="text-xs text-muted-foreground">Status: {team.status}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">{team.name} Dashboard</h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Edit Team
          </button>
          {team.status === 'Archived' ? (
            <button
              onClick={handleReopen}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reopen Team</span>
            </button>
          ) : (
            <button
              onClick={handleArchive}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
            >
              <Archive className="w-4 h-4" />
              <span>Archive Team</span>
            </button>
          )}
          <button
            onClick={handleDeleteTeam}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
          >
            Delete Team
          </button>
          <Link
            href={`/teams/${id}`}
            className="px-4 py-2 rounded-lg text-xs font-semibold border hover:bg-accent text-foreground"
          >
            Public View
          </Link>
        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-6">Edit Team</h2>
            
            <div className="space-y-4">
              <div>
                <Input 
                  label="Team Name *"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  className="w-full bg-background border border-input rounded-xl px-4 py-2 h-24 resize-none"
                />
              </div>
              <div>
                <Input 
                  label="Required Skills"
                  value={editForm.requiredSkills}
                  onChange={e => setEditForm({...editForm, requiredSkills: e.target.value})}
                  placeholder="Comma separated (e.g., React, Node)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTeam} disabled={saving} isLoading={saving}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Applicants Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                Pending Applicants ({teamApplicants.filter((r) => r.status === 'Pending').length})
              </h3>

              {selectedRequests.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkStatus('Accepted')}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Accept Selected ({selectedRequests.length})
                  </button>
                  <button
                    onClick={() => handleBulkStatus('Rejected')}
                    className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
                  >
                    Reject Selected
                  </button>
                </div>
              )}
            </div>

            {teamApplicants.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No applications yet.</p>
            ) : (
              <div className="divide-y">
                {teamApplicants.map((req) => (
                  <div key={req._id} className="py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      {req.status === 'Pending' && (
                        <input
                          type="checkbox"
                          checked={selectedRequests.includes(req._id)}
                          onChange={() => toggleSelect(req._id)}
                          className="mt-1 rounded border-gray-300 text-primary"
                        />
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-foreground text-sm">
                            {typeof req.user === 'object' ? req.user.name : 'Applicant'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">
                            {req.status}
                          </span>
                        </div>
                        {typeof req.user === 'object' && (
                          <div className="flex flex-col gap-2 mt-2 mb-2 w-full">
                            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground font-medium">
                              {req.user.email && (
                                <span className="flex items-center">
                                  ✉️ {req.user.email}
                                </span>
                              )}
                              {req.user.college && (
                                <span className="flex items-center">
                                  🏫 {req.user.college} {req.user.year ? `(Year ${req.user.year})` : ''}
                                </span>
                              )}
                            </div>
                            
                            {req.user.bio && (
                              <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                {req.user.bio}
                              </p>
                            )}

                            {req.user.skills && req.user.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {req.user.skills.map((skill: string, idx: number) => (
                                  <span key={idx} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center space-x-3 mt-1">
                              {req.user.github && (
                                <a href={req.user.github} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors flex items-center space-x-1" title="GitHub">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {req.user.linkedin && (
                                <a href={req.user.linkedin} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-[#0A66C2] transition-colors flex items-center space-x-1" title="LinkedIn">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              {req.user.portfolio && (
                                <a href={req.user.portfolio} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1" title="Portfolio">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        {req.message && (
                          <div className="mt-2 bg-accent/30 border border-border/50 p-3 rounded-lg text-sm text-foreground italic shadow-sm relative">
                            <span className="absolute -top-2 left-3 bg-card px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Join Message</span>
                            &quot;{req.message}&quot;
                          </div>
                        )}
                      </div>
                    </div>

                    {req.status === 'Pending' && (
                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={async () => {
                            await updateStatus(req._id, 'Accepted');
                            await fetchTeam();
                          }}
                          className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            await updateStatus(req._id, 'Rejected');
                            await fetchTeam();
                          }}
                          className="p-1.5 rounded-lg bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Team Members & Leadership Transfer */}
        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-foreground flex items-center space-x-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Current Members ({team.members?.length || 1})</span>
            </h3>

            <div className="divide-y">
              {team.members?.map((m: any) => {
                const memberObj = typeof m === 'object' ? m : { _id: m, name: 'Member' };
                const isLeader =
                  (typeof team.leader === 'object' ? team.leader._id : team.leader) === memberObj._id;

                return (
                  <div key={memberObj._id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                        {memberObj.name ? memberObj.name[0].toUpperCase() : 'M'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          {memberObj.name}
                        </span>
                        {isLeader && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center space-x-0.5">
                            <Crown className="w-3 h-3" />
                            <span>Leader</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {!isLeader && (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleTransferLeadership(memberObj._id)}
                          title="Make Leader"
                          className="p-1 rounded text-muted-foreground hover:text-amber-500"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(memberObj._id)}
                          title="Remove Member"
                          className="p-1 rounded text-muted-foreground hover:text-red-500"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      </div>
    </MainLayout>
  );
}
