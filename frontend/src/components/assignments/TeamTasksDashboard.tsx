import React, { useState } from 'react';
import { TaskBoard } from './TaskBoard';
import { MembersSection } from './MembersSection';
import { AssignTaskModal } from './AssignTaskModal';
import { Button } from '@/components/ui/Button';
import { Plus, Users, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface TeamTasksDashboardProps {
 teams: any[];
 tasks: any[];
 userId: string;
 onAssignTask: (taskData: any) => Promise<void>;
}

export const TeamTasksDashboard: React.FC<TeamTasksDashboardProps> = ({ teams, tasks, userId, onAssignTask }) => {
 const router = useRouter();
 const [activeTab, setActiveTab] = useState<'board' | 'members'>('board');
 const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?._id || '');
 const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

 const selectedTeam = teams.find(t => t._id === selectedTeamId);
 
 const getMembersExcludingLeader = () => {
  if (!selectedTeam || !selectedTeam.members) return [];
  return selectedTeam.members.filter((m: any) => m._id !== selectedTeam.leader?._id && m._id !== selectedTeam.leader);
 };

 const filteredTasks = tasks.filter(t => t.team?._id === selectedTeamId || t.team === selectedTeamId);

 const handleReviewClick = (task: any) => {
  router.push(`/assignments/${task._id}`);
 };

 return (
  <div className="space-y-6">
   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
    <div>
     <h1 className="text-3xl font-bold text-foreground tracking-tight">Team Tasks</h1>
     <p className="text-muted-foreground dark:text-muted-foreground mt-1">Assign work, track progress, and review your team's submissions.</p>
    </div>
    
    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
     {teams.length > 1 && (
      <select
       className="px-4 py-2 bg-white dark:bg-accent border border-border dark:border-border rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary outline-none "
       value={selectedTeamId}
       onChange={(e) => setSelectedTeamId(e.target.value)}
      >
       {teams.map((t) => (
        <option key={t._id} value={t._id}>{t.name}</option>
       ))}
      </select>
     )}
     
     <Button onClick={() => setIsAssignModalOpen(true)} className="flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Assign Task
     </Button>
    </div>
   </div>

   <div className="flex space-x-1 border-b border-border dark:border-border pb-px">
    <button
     onClick={() => setActiveTab('board')}
     className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      activeTab === 'board' 
       ? 'border-primary text-primary' 
       : 'border-transparent text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground'
     }`}
    >
     <LayoutDashboard className="w-4 h-4" />
     Task Board
    </button>
    <button
     onClick={() => setActiveTab('members')}
     className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      activeTab === 'members' 
       ? 'border-primary text-primary' 
       : 'border-transparent text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground'
     }`}
    >
     <Users className="w-4 h-4" />
     Members
    </button>
   </div>

   <div className="pt-4">
    {activeTab === 'board' ? (
     <TaskBoard tasks={filteredTasks} onReviewClick={handleReviewClick} />
    ) : (
     <MembersSection members={selectedTeam?.members || []} tasks={filteredTasks} leaderId={userId} />
    )}
   </div>

   <AssignTaskModal
    isOpen={isAssignModalOpen}
    onClose={() => setIsAssignModalOpen(false)}
    onSubmit={async (data) => {
     try {
      await onAssignTask(data);
      setIsAssignModalOpen(false);
     } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to assign task');
      throw err;
     }
    }}
    members={getMembersExcludingLeader()}
    teamId={selectedTeamId}
   />
  </div>
 );
};

