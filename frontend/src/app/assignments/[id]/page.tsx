'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/axios';
import { toast } from 'react-hot-toast';
import { StudentTaskWorkspace } from '@/components/assignments/StudentTaskWorkspace';
import { SubmissionReview } from '@/components/assignments/SubmissionReview';
import { useParams, useRouter } from 'next/navigation';

export default function TaskWorkspacePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  
  const [task, setTask] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLeader, setIsLeader] = useState(false);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        const meRes = await api.get('/users/me');
        const myProfile = meRes.data.data;

        // Fetch task details (Note: We need to find the task by looking through team assignments)
        // Since there is no single GET /assignments/:id endpoint without team context in some setups,
        // we might have to fetch the user's teams and find the task.
        // Let's first try to get all teams to find this task
        const teamsRes = await api.get('/teams');
        const allTeams = teamsRes.data.data || teamsRes.data.items || (Array.isArray(teamsRes.data) ? teamsRes.data : []);
        
        let foundTask = null;
        let foundTeam = null;
        let isUserLeader = false;

        for (const t of allTeams) {
          try {
            const teamAssignmentsRes = await api.get(`/assignments/team/${t._id}`);
            const teamAssignments = teamAssignmentsRes.data;
            const targetTask = teamAssignments.find((a: any) => a._id === id);
            
            if (targetTask) {
              foundTask = targetTask;
              foundTeam = t;
              
              // Check if user is leader of this specific team
              const detailedTeamRes = await api.get(`/teams/${t._id}`);
              const detailedTeam = detailedTeamRes.data;
              const leaderId = detailedTeam.leader?._id || detailedTeam.leader;
              isUserLeader = leaderId?.toString() === myProfile._id?.toString();
              break;
            }
          } catch (e) {
            // Ignore if error on a specific team
          }
        }

        if (!foundTask) {
          toast.error('Task not found');
          router.push('/assignments');
          return;
        }

        // Attach team data to task
        foundTask.team = foundTeam;

        // If not a leader and not assigned to this task, deny access
        if (!isUserLeader && foundTask.assignedTo?._id !== myProfile._id && foundTask.assignedTo !== myProfile._id) {
          toast.error('You are not authorized to view this task');
          router.push('/assignments');
          return;
        }

        setIsLeader(isUserLeader);

        // Try to fetch submission if it exists
        try {
          const submissionRes = await api.get(`/assignments/${foundTask._id}/submissions`);
          // For a student, there's only one submission. For a leader, it returns a list.
          const subs = Array.isArray(submissionRes.data) ? submissionRes.data : [submissionRes.data];
          if (subs && subs.length > 0) {
            // Get the submission for this specific task
            // Leader gets all submissions for the task, student gets theirs
            const relevantSubmission = isUserLeader ? subs[0] : subs.find((s: any) => s.user?._id === myProfile._id || s.user === myProfile._id);
            setSubmission(relevantSubmission || null);
            foundTask.submission = relevantSubmission;
          }
        } catch (e) {
          // No submissions yet or error fetching
        }

        setTask(foundTask);
      } catch (err) {
        toast.error('Failed to load task details');
        router.push('/assignments');
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchTaskDetails();
    }
  }, [user, id, router]);

  const handleSubmitWork = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append('teamId', task.team._id);
      formData.append('submissionType', data.submissionType);
      formData.append('notes', data.notes);
      if (data.githubUrl) formData.append('githubUrl', data.githubUrl);
      if (data.file) formData.append('file', data.file);

      await api.post(`/assignments/${task._id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // After submit, update local state
      setTask({ ...task, status: 'Submitted' });
      toast.success('Work submitted successfully!');
      
      // Refresh page to get latest submission data
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to submit work');
    }
  };

  const handleEvaluate = async (data: { marks: number; feedback: string; status: 'Accepted' | 'Rejected' }) => {
    try {
      await api.put(`/assignments/${task._id}/evaluate`, {
        submissionId: submission._id,
        marks: data.marks,
        feedback: data.feedback,
        status: data.status,
      });

      setTask({ ...task, status: data.status === 'Accepted' ? 'Closed' : 'In Progress' });
      setSubmission({ ...submission, marks: data.marks, feedback: data.feedback, status: data.status === 'Accepted' ? 'Evaluated' : 'Returned' });
      
      toast.success(`Submission ${data.status.toLowerCase()} successfully!`);
      
      // Refresh to update UI cleanly
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to evaluate submission');
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !task ? (
          <div className="text-center py-12">Task not found</div>
        ) : isLeader ? (
          <SubmissionReview 
            task={task} 
            submission={submission} 
            onEvaluate={handleEvaluate} 
          />
        ) : (
          <StudentTaskWorkspace 
            task={task} 
            onSubmitWork={handleSubmitWork} 
          />
        )}
      </div>
    </MainLayout>
  );
}
