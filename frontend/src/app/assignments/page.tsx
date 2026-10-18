'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { MyTasksDashboard } from '@/components/assignments/MyTasksDashboard';
import { TeamTasksDashboard } from '@/components/assignments/TeamTasksDashboard';

interface Assignment {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  team?: { _id: string; name: string; leader?: any };
  assignedTo?: { _id: string; name: string; email?: string; avatarUrl?: string };
  submission?: any;
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Assignment[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const meRes = await api.get('/users/me');
        const myProfile = meRes.data.data;
        
        const teamsRes = await api.get('/teams');
        const allTeams = teamsRes.data.data || teamsRes.data.items || (Array.isArray(teamsRes.data) ? teamsRes.data : []);
        
        const detailedTeamsPromises = allTeams.map((t: any) => 
          api.get(`/teams/${t._id}`).then(r => r.data).catch(() => t)
        );
        const detailedTeams = await Promise.all(detailedTeamsPromises);

        let userIsLeader = false;
        const myTeams = detailedTeams.filter((t: any) => {
          if (!t || !t._id) return false;
          const leaderId = t.leader?._id || t.leader;
          const checkIsLeader = leaderId?.toString() === myProfile._id?.toString();
          const checkIsMember = (t.members || []).some((m: any) => (m._id || m)?.toString() === myProfile._id?.toString());
          
          if (checkIsLeader) userIsLeader = true;
          
          return checkIsLeader || checkIsMember;
        });

        setTeams(myTeams);
        setIsLeader(userIsLeader);

        if (myTeams.length > 0) {
          const assignmentsPromises = myTeams.map((t: any) => api.get(`/assignments/team/${t._id}`).catch(() => ({ data: [] })));
          const assignmentsResults = await Promise.all(assignmentsPromises);
          
          let allAssignments: Assignment[] = [];
          assignmentsResults.forEach((res, idx) => {
            if (res.data && Array.isArray(res.data)) {
              const teamAssignments = res.data.map((a: any) => ({
                ...a,
                team: myTeams[idx],
                status: a.status || 'Open'
              }));
              allAssignments = [...allAssignments, ...teamAssignments];
            }
          });

          // If not a leader, only show tasks assigned to me
          if (!userIsLeader) {
            allAssignments = allAssignments.filter(a => a.assignedTo?._id === myProfile._id || a.assignedTo === myProfile._id);
          }

          setTasks(allAssignments);
        }
      } catch (err) {
        console.error('Failed to fetch assignments', err);
        toast.error('Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleAssignTask = async (taskData: any) => {
    const res = await api.post('/assignments', {
      team: taskData.teamId,
      teamId: taskData.teamId,
      title: taskData.title,
      description: taskData.description,
      deadline: taskData.deadline,
      assignedTo: taskData.assignedTo,
    });
    
    const created = res.data;
    const team = teams.find(t => t._id === taskData.teamId);
    const assignedMember = team?.members?.find((m: any) => m._id === taskData.assignedTo);
    
    setTasks(prev => [{ ...created, team, assignedTo: assignedMember, status: 'Assigned' }, ...prev]);
    toast.success('Task created and assigned to member successfully!');
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : isLeader ? (
          <TeamTasksDashboard 
            teams={teams} 
            tasks={tasks} 
            userId={user?.id || ''} 
            onAssignTask={handleAssignTask} 
          />
        ) : (
          <MyTasksDashboard tasks={tasks} />
        )}
      </div>
    </MainLayout>
  );
}
