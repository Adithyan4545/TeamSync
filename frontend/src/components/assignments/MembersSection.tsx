import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

interface Member {
 _id: string;
 name: string;
 email: string;
 avatarUrl?: string;
 role?: string;
}

interface Assignment {
 _id: string;
 title: string;
 status: string;
 assignedTo?: {
  _id: string;
 };
}

interface MembersSectionProps {
 members: Member[];
 tasks: Assignment[];
 leaderId: string;
}

export const MembersSection: React.FC<MembersSectionProps> = ({ members, tasks, leaderId }) => {
 if (members.length === 0) {
  return (
   <EmptyState
    title="No team members found"
    description="Your team currently has no members."
    icon={Users}
   />
  );
 }

 const getInitials = (name?: string) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
 };

 const getMemberTaskStats = (memberId: string) => {
  const memberTasks = tasks.filter((t) => t.assignedTo?._id === memberId);
  
  // Find active task (not completed/archived)
  const activeTask = memberTasks.find(
   (t) => t.status !== 'Closed' && t.status !== 'Accepted' && t.status !== 'Archived'
  );
  
  // Count completed tasks
  const completedCount = memberTasks.filter(
   (t) => t.status === 'Closed' || t.status === 'Accepted'
  ).length;

  return { activeTask, completedCount };
 };

 const getStatusBadge = (status: string) => {
  switch (status) {
   case 'Assigned': return <Badge className="bg-blue-100 text-blue-800 border-0">Assigned</Badge>;
   case 'In Progress': return <Badge className="bg-yellow-100 text-yellow-800 border-0">In Progress</Badge>;
   case 'Submitted': return <Badge className="bg-purple-100 text-purple-800 border-0">Submitted</Badge>;
   case 'Evaluated': return <Badge className="bg-orange-100 text-orange-800 border-0">Under Review</Badge>;
   default: return <Badge variant="outline">{status}</Badge>;
  }
 };

 return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
   {members.map((member) => {
    const isLeader = member._id === leaderId;
    const { activeTask, completedCount } = getMemberTaskStats(member._id);

    return (
     <Card key={member._id} className="glass-card">
      <CardContent className="p-6">
       <div className="flex items-center gap-4 mb-6">
        <Avatar src={member.avatarUrl} fallback={getInitials(member.name)} className="h-16 w-16 border-2 border-border dark:border-border" size="xl" />
        <div>
         <h3 className="font-bold text-lg text-foreground leading-none mb-2">{member.name}</h3>
         <Badge variant="outline" className="bg-muted/30 dark:bg-muted border-border dark:border-border">
          {isLeader ? 'Team Leader' : member.role || 'Member'}
         </Badge>
        </div>
       </div>

       {!isLeader && (
        <div className="space-y-4">
         <div className="bg-muted/30 dark:bg-muted/50 rounded-lg p-3 border border-border dark:border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Current Task</p>
          {activeTask ? (
           <div>
            <p className="font-medium text-sm text-foreground mb-2 truncate" title={activeTask.title}>
             {activeTask.title}
            </p>
            {getStatusBadge(activeTask.status)}
           </div>
          ) : (
           <p className="text-sm text-muted-foreground italic">No active task</p>
          )}
         </div>
         
         <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Completed Tasks:</span>
          <span className="font-bold text-foreground dark:text-muted-foreground bg-muted/50 dark:bg-muted px-2 py-0.5 rounded-md">
           {completedCount}
          </span>
         </div>
        </div>
       )}
      </CardContent>
     </Card>
    );
   })}
  </div>
 );
};

