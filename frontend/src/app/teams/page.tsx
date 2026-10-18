'use client';

import React, { useState } from 'react';
import { useTeams } from '@/hooks/useTeams';
import { useJoinRequests } from '@/hooks/useJoinRequests';
import { useHackathons } from '@/hooks/useHackathons';
import { TeamSearch } from '@/components/team/TeamSearch';
import { TeamFilters } from '@/components/team/TeamFilters';
import { TeamGrid } from '@/components/team/TeamGrid';
import MainLayout from '@/components/layout/MainLayout';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function TeamsPage() {
  const { teams, total, page, limit, loading, params, setParams, refetch } = useTeams();
  const { userRequests, sendRequest, cancelRequest } = useJoinRequests();
  const { hackathons } = useHackathons({ limit: 100 });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '', requiredSkills: '', maxMembers: '', hackathon: '' });

  const handleCreateTeam = async () => {
    if (!newTeam.name) return toast.error('Team name is required');
    if (!newTeam.hackathon) return toast.error('Hackathon is required');
    if (!newTeam.maxMembers || isNaN(Number(newTeam.maxMembers))) return toast.error('Valid max members is required');
    
    try {
      setCreating(true);
      const skillsArray = newTeam.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      await api.post('/teams', {
        name: newTeam.name,
        description: newTeam.description,
        requiredSkills: skillsArray,
        status: 'Open',
        hackathon: newTeam.hackathon,
        maxMembers: Number(newTeam.maxMembers)
      });
      toast.success('Team created successfully!');
      setIsCreateModalOpen(false);
      setNewTeam({ name: '', description: '', requiredSkills: '', maxMembers: '', hackathon: '' });
      if (refetch) refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const handleSearchChange = (q: string) => {
    setParams((prev) => ({ ...prev, q: q || undefined, page: 1 }));
  };

  const handleSortChange = (sortBy: string) => {
    setParams((prev) => ({ ...prev, sortBy: sortBy as any, page: 1 }));
  };

  const handleFilterChange = (newFilters: any) => {
    setParams((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setParams({ page: 1, limit: 12 });
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <MainLayout>
      <div className="space-y-8 pb-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest uppercase text-gradient drop-shadow-md">
              Browse Teams
            </h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
              Find open teams looking for members, view team leaders, and send join requests.
            </p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create Team
          </Button>
        </motion.div>

        {/* Search & Sort */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TeamSearch
            value={params.q || ''}
            onChange={handleSearchChange}
            sortBy={params.sortBy || 'createdAt'}
            onSortChange={handleSortChange}
          />
        </motion.div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <TeamFilters
              filters={params}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
            />
          </motion.div>

          {/* Team Grid */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 space-y-6"
          >
            <TeamGrid
              teams={teams}
              userRequests={userRequests}
              onSendRequest={sendRequest}
              onCancelRequest={cancelRequest}
              loading={loading}
            />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-6">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setParams((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
                >
                  Previous
                </Button>
                <span className="text-sm font-medium text-muted-foreground px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setParams((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold mb-6">Create New Team</h2>
              
              <div className="space-y-4">
                <div>
                  <Input 
                    label="Team Name *"
                    value={newTeam.name}
                    onChange={e => setNewTeam({...newTeam, name: e.target.value})}
                    placeholder="E.g., Syntax Errors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Hackathon *</label>
                  <select 
                    value={newTeam.hackathon}
                    onChange={e => setNewTeam({...newTeam, hackathon: e.target.value})}
                    className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Select a hackathon...</option>
                    {hackathons && hackathons.length > 0 ? (
                      hackathons.map((h: any) => (
                        <option key={h._id} value={h._id}>{h.title}</option>
                      ))
                    ) : (
                      <option disabled>No hackathons available</option>
                    )}
                  </select>
                </div>
                <div>
                  <Input 
                    label="Max Members *"
                    type="number"
                    value={newTeam.maxMembers}
                    onChange={e => setNewTeam({...newTeam, maxMembers: e.target.value})}
                    placeholder="E.g., 4"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea 
                    value={newTeam.description}
                    onChange={e => setNewTeam({...newTeam, description: e.target.value})}
                    className="w-full bg-background border border-input rounded-xl px-4 py-2 h-24 resize-none"
                    placeholder="What is your team about?"
                  />
                </div>
                <div>
                  <Input 
                    label="Required Skills"
                    value={newTeam.requiredSkills}
                    onChange={e => setNewTeam({...newTeam, requiredSkills: e.target.value})}
                    placeholder="Comma separated (e.g., React, Node, UI/UX)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTeam} disabled={creating} isLoading={creating}>
                  Create Team
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
