import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TaskCardProps {
 task: {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  status: string;
  team?: {
   name: string;
  };
 };
}

const getStatusConfig = (status: string) => {
 switch (status) {
  case 'Assigned':
   return { label: 'Assigned', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' };
  case 'In Progress':
   return { label: 'In Progress', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' };
  case 'Submitted':
   return { label: 'Submitted', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' };
  case 'Accepted':
  case 'Closed':
   return { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
  default:
   return { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
 }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
 const statusConfig = getStatusConfig(task.status);
 const formattedDate = task.deadline
  ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(task.deadline))
  : 'No deadline';

 return (
  <Card className="flex flex-col h-full glass-card hover:shadow-lg transition-shadow duration-300">
   <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0 gap-4">
    <div>
     <CardTitle className="text-xl font-bold leading-tight">{task.title}</CardTitle>
     <p className="text-sm font-medium text-muted-foreground dark:text-muted-foreground mt-1">
      Team: <span className="text-primary">{task.team?.name || 'Unknown'}</span>
     </p>
    </div>
    <Badge variant="outline" className={`px-2 py-1 rounded-full whitespace-nowrap border-0 ${statusConfig.className}`}>
     {statusConfig.label}
    </Badge>
   </CardHeader>

   <CardContent className="flex-1">
    <p className="text-muted-foreground dark:text-muted-foreground text-sm line-clamp-3">
     {task.description || 'No description provided.'}
    </p>
    <div className="flex items-center text-sm font-medium text-muted-foreground dark:text-muted-foreground mt-4">
     <Calendar className="w-4 h-4 mr-2" />
     Due: {formattedDate}
    </div>
   </CardContent>

   <CardFooter className="pt-4 border-t border-border dark:border-border">
    <Link href={`/assignments/${task._id}`} className="w-full">
     <Button variant="outline" className="w-full justify-between hover:bg-primary hover:text-white transition-colors border-border dark:border-border">
      <span>Open Task</span>
      <ArrowRight className="w-4 h-4 ml-2" />
     </Button>
    </Link>
   </CardFooter>
  </Card>
 );
};

