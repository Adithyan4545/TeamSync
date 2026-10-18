import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Calendar } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface Assignment {
 _id: string;
 title: string;
 description: string;
 deadline: string;
 status: string;
 submission?: any;
 assignedTo?: {
  _id: string;
  name: string;
  avatarUrl?: string;
 };
}

interface TaskBoardProps {
 tasks: Assignment[];
 onReviewClick: (task: Assignment) => void;
}

const COLUMNS = [
 { id: 'ASSIGNED', title: 'ASSIGNED', bgClass: 'bg-blue-50 dark:bg-accent/50', borderClass: 'border-blue-200 dark:border-blue-900' },
 { id: 'IN PROGRESS', title: 'IN PROGRESS', bgClass: 'bg-yellow-50 dark:bg-accent/50', borderClass: 'border-yellow-200 dark:border-yellow-900' },
 { id: 'SUBMITTED', title: 'SUBMITTED', bgClass: 'bg-purple-50 dark:bg-accent/50', borderClass: 'border-purple-200 dark:border-purple-900' },
 { id: 'UNDER REVIEW', title: 'UNDER REVIEW', bgClass: 'bg-orange-50 dark:bg-accent/50', borderClass: 'border-orange-200 dark:border-orange-900' },
 { id: 'COMPLETED', title: 'COMPLETED', bgClass: 'bg-green-50 dark:bg-accent/50', borderClass: 'border-green-200 dark:border-green-900' },
];

const getColumnForTask = (task: Assignment) => {
 if (task.status === 'Assigned') return 'ASSIGNED';
 if (task.status === 'In Progress') return 'IN PROGRESS';
 if (task.status === 'Submitted' && !task.submission) return 'SUBMITTED';
 if (task.status === 'Submitted' && task.submission) return 'UNDER REVIEW'; // UI mapping
 if (task.status === 'Evaluated' || task.status === 'Accepted' || task.status === 'Closed') return 'COMPLETED';
 return 'ASSIGNED'; // fallback
};

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onReviewClick }) => {
 const tasksByColumn = COLUMNS.reduce((acc, col) => {
  acc[col.id] = tasks.filter((t) => getColumnForTask(t) === col.id);
  return acc;
 }, {} as Record<string, Assignment[]>);

 const formatDate = (dateString?: string) => {
  if (!dateString) return 'No deadline';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateString));
 };

 const getInitials = (name?: string) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
 };

 return (
  <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 items-start">
   {COLUMNS.map((col) => (
    <div key={col.id} className={`flex-shrink-0 w-full md:w-80 rounded-xl border ${col.borderClass} ${col.bgClass} flex flex-col max-h-[80vh]`}>
     <div className="p-4 border-b border-inherit font-semibold text-sm tracking-wider text-foreground dark:text-muted-foreground flex justify-between items-center">
      {col.title}
      <span className="bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground py-0.5 px-2 rounded-full text-xs">
       {tasksByColumn[col.id].length}
      </span>
     </div>
     
     <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[150px]">
      {tasksByColumn[col.id].map((task) => (
       <Card key={task._id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-muted relative">
        <CardContent className="p-4 flex flex-col gap-3">
         <div className="font-medium text-foreground leading-tight">
          {task.title}
         </div>
         
         {task.assignedTo && (
          <div className="flex items-center gap-2">
           <Avatar src={task.assignedTo.avatarUrl} fallback={getInitials(task.assignedTo.name)} className="h-6 w-6" size="sm" />
           <span className="text-sm text-muted-foreground dark:text-muted-foreground truncate">
            {task.assignedTo.name}
           </span>
          </div>
         )}

         <div className="flex items-center text-xs font-medium text-muted-foreground dark:text-muted-foreground pt-2 border-t border-border dark:border-border mt-1">
          <Calendar className="w-3 h-3 mr-1" />
          Due {formatDate(task.deadline)}
         </div>
        </CardContent>

        {(col.id === 'SUBMITTED' || col.id === 'UNDER REVIEW') && (
         <CardFooter className="p-3 pt-0">
          <Button 
           variant="primary" 
           size="sm" 
           className="w-full text-xs h-8"
           onClick={() => onReviewClick(task)}
          >
           Review Submission
          </Button>
         </CardFooter>
        )}
       </Card>
      ))}
     </div>
    </div>
   ))}
  </div>
 );
};

