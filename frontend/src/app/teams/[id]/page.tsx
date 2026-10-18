'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { TeamLeaderCard } from '@/components/team/TeamLeaderCard';
import { JoinRequestButton } from '@/components/team/JoinRequestButton';
import TeamChat from '@/components/chat/TeamChat';
import { useJoinRequests } from '@/hooks/useJoinRequests';
import { Users, Target, MessageSquare, Globe, LogOut, CheckCircle, XCircle, AlertTriangle, UserPlus, Sparkles, Settings } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export default function TeamDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();

  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview');

  // Exit request state
  const [exitRequests, setExitRequests] = useState<any[]>([]);
  const [showExitModal, setShowExitModal] = useState(false);
  const [exitReason, setExitReason] = useState('');
  const [submittingExit, setSubmittingExit] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const { userRequests, sendRequest, cancelRequest } = useJoinRequests();

  const fetchTeamDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/teams/${id}`);
      setTeam(res.data);

      // Fetch exit requests if user is logged in
      if (user) {
        try {
          const exitRes = await api.get(`/team-exit-requests/team/${id}`);
          setExitRequests(exitRes.data || []);
        } catch {
          // Non-critical if non-member
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id, user?.id]);

  const handleRequestExit = async () => {
    setSubmittingExit(true);
    setActionMessage(null);
    try {
      await api.post('/team-exit-requests', { teamId: id, reason: exitReason });
      setShowExitModal(false);
      setExitReason('');
      setActionMessage('Exit request submitted successfully. Waiting for leader approval.');
      fetchTeamDetails();
    } catch (err: any) {
      setActionMessage(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setSubmittingExit(false);
    }
  };

  const handleApproveExit = async (requestId: string) => {
    try {
      await api.patch(`/team-exit-requests/${requestId}/approve`);
      setActionMessage('Member exit approved. Open replacement position created automatically.');
      fetchTeamDetails();
    } catch (err: any) {
      setActionMessage(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleRejectExit = async (requestId: string) => {
    try {
      await api.patch(`/team-exit-requests/${requestId}/reject`);
      setActionMessage('Member exit request rejected.');
      fetchTeamDetails();
    } catch (err: any) {
      setActionMessage(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="h-80 bg-muted/60 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-foreground">Team Not Found</h2>
        <p className="text-sm text-muted-foreground mt-2">{error || 'Unable to fetch details'}</p>
        <Link href="/teams" className="inline-block mt-4 text-sm font-semibold text-primary underline">
          Back to Teams
        </Link>
      </div>
    );
  }

  const leaderId = typeof team.leader === 'object' ? team.leader._id : team.leader;
  const isLeader = user?.id === leaderId;

  const memberIds = (team.members || []).map((m: any) => (typeof m === 'object' ? m._id : m));
  const isMember = user?.id && memberIds.includes(user.id);

  const userReq = userRequests.find(
    (req) => (typeof req.team === 'object' ? req.team._id : req.team) === team._id
  );

  const myPendingExit = exitRequests.find(
    (r) => (typeof r.member === 'object' ? r.member._id : r.member) === user?.id && r.status === 'Pending'
  );

  const pendingExitRequests = exitRequests.filter((r) => r.status === 'Pending');

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Alert Banner */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-medium flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs font-bold underline ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* Team Header Card */}
      <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 mb-2">
              {team.status || 'Open'}
            </span>
            <h1 className="text-3xl font-extrabold text-foreground">{team.name}</h1>
            {team.hackathon && (
              <p className="text-sm text-muted-foreground mt-1">
                Participating in{' '}
                <span className="font-semibold text-foreground">
                  {typeof team.hackathon === 'object' ? team.hackathon.title : 'Hackathon'}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Exit Team Button for Normal Member */}
            {isMember && !isLeader && (
              myPendingExit ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  🟡 Exit Request Pending
                </span>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setShowExitModal(true)}
                  className="text-destructive hover:bg-destructive/10 border-destructive/30"
                >
                  <LogOut className="w-4 h-4 mr-1.5" /> Exit Team
                </Button>
              )
            )}

            {/* Dashboard Button for Leaders */}
            {isLeader && (
              <Link href={`/teams/${team._id}/dashboard`}>
                <Button className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:scale-105 active:scale-95">
                  <Settings className="w-4 h-4 mr-1.5" /> Manage Team
                </Button>
              </Link>
            )}

            {/* Join Request Button for Non-members */}
            {!isLeader && !isMember && (
              <JoinRequestButton
                status={userReq?.status}
                onSend={() => sendRequest(team._id)}
                onCancel={() => cancelRequest(team._id)}
              />
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {team.description || 'No description provided.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-500" />
            <div>
              <div className="text-xs text-muted-foreground">Members</div>
              <div className="text-sm font-bold text-foreground">
                {team.members?.length || 1} / {team.maxMembers || 4}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-xs text-muted-foreground">Visibility</div>
              <div className="text-sm font-bold text-foreground">{team.visibility || 'Public'}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-xs text-muted-foreground">Platform</div>
              <div className="text-sm font-bold text-foreground">
                {team.communicationPlatform || 'Discord / Slack'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LEADER VIEW: Pending Exit Requests Section */}
      {isLeader && pendingExitRequests.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2 font-bold text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Pending Exit Requests ({pendingExitRequests.length})</span>
          </div>

          <div className="space-y-3">
            {pendingExitRequests.map((req) => {
              const memberName = typeof req.member === 'object' ? req.member.name : 'Team Member';
              return (
                <div
                  key={req._id}
                  className="bg-card border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="font-bold text-foreground">{memberName}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-semibold text-primary">{req.roleAtExit}</span> • Reason: &quot;{req.reason || 'No reason provided'}&quot;
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveExit(req._id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approve Exit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectExit(req._id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Replacement Roles / Open Roles Section */}
      {team.openRoles && team.openRoles.length > 0 && (
        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-foreground">
              <UserPlus className="w-5 h-5 text-primary" />
              <span>Open Replacement Positions</span>
            </div>
            {isLeader && (
              <Link href="/ai-match">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-semibold">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Find Replacement Candidates
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {team.openRoles.map((role: string, idx: number) => (
              <div key={idx} className="bg-accent/40 border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {role}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    OPEN
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Skills Required: {(team.requiredSkills || []).join(' • ') || 'General Skills'}
                </p>
                {!isLeader && !isMember && (
                  <div className="pt-2">
                    <JoinRequestButton
                      status={userReq?.status}
                      onSend={() => sendRequest(team._id)}
                      onCancel={() => cancelRequest(team._id)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      {isMember && (
        <div className="flex items-center space-x-1 border-b border-border pb-px mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
              activeTab === 'chat'
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Team Chat</span>
          </button>
        </div>
      )}

      {/* Grid Layout - Render conditionally based on activeTab */}
      {activeTab === 'overview' || !isMember ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left main column */}
          <div className="md:col-span-2 space-y-6">
          {/* Project Idea */}
          {team.projectIdea && (
            <div className="bg-card border rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-foreground flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-primary" />
                <span>Project Idea</span>
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {team.projectIdea}
              </p>
            </div>
          )}

          {/* Required Skills */}
          <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
            {team.requiredSkills && team.requiredSkills.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Required Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {team.requiredSkills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-md"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Leader Column */}
        <div className="space-y-6">
          <TeamLeaderCard leader={team.leader} />
        </div>
      </div>
      ) : (
        <div className="w-full">
          {user?.id && (
            <TeamChat
              teamId={team._id}
              teamName={team.name}
              currentUserId={user.id}
              teamStatus={team.status}
            />
          )}
        </div>
      )}

      {/* Confirmation Modal for Exit Team */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-destructive">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">Are you sure you want to leave this team?</h3>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Your exit request must be approved by the team leader before you are removed. You will remain in the team while your request is pending.
            </p>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">Reason for exit (optional)</label>
              <textarea
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                placeholder="e.g. Schedule conflict, switching focus area..."
                className="w-full h-20 bg-background/50 border border-input rounded-xl p-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button variant="outline" onClick={() => setShowExitModal(false)} disabled={submittingExit}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleRequestExit}
                disabled={submittingExit}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold border-none"
              >
                {submittingExit ? 'Submitting...' : 'Confirm Exit Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
