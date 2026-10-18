import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { ClipboardList, Search } from 'lucide-react';

interface Assignment {
 _id: string;
 title: string;
 description: string;
 deadline: string;
 status: string;
 team?: {
  _id: string;
  name: string;
 };
}

interface MyTasksDashboardProps {
 tasks: Assignment[];
}

const FILTERS = ['All', 'Assigned', 'In Progress', 'Submitted', 'Completed'];

export const MyTasksDashboard: React.FC<MyTasksDashboardProps> = ({ tasks }) => {
 const [filter, setFilter] = useState('All');

 const filteredTasks = tasks.filter((task) => {
  if (filter === 'All') return true;
  
  // Map backend statuses to filter statuses
  const status = task.status;
  if (filter === 'Completed' && (status === 'Accepted' || status === 'Closed')) return true;
  if (filter === 'Submitted' && status === 'Submitted') return true;
  if (filter === 'In Progress' && status === 'In Progress') return true;
  if (filter === 'Assigned' && status === 'Assigned') return true;
  
  return false;
 });

 return (
  <div className="space-y-6">
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
     <h1 className="text-3xl font-bold text-foreground tracking-tight">My Tasks</h1>
     <p className="text-muted-foreground dark:text-muted-foreground mt-1">Tasks assigned to you by your team leader.</p>
    </div>
   </div>

   {tasks.length > 0 && (
    <div className="flex flex-wrap gap-2 pb-2">
     {FILTERS.map((f) => (
      <Button
       key={f}
       variant={filter === f ? 'primary' : 'outline'}
       size="sm"
       onClick={() => setFilter(f)}
       className="rounded-full px-4"
      >
       {f}
      </Button>
     ))}
    </div>
   )}

   {tasks.length === 0 ? (
    <EmptyState
     title="No tasks assigned yet"
     description="Your team leader hasn't assigned work to you yet."
     icon={ClipboardList}
    />
   ) : filteredTasks.length === 0 ? (
    <EmptyState
     title="No tasks found"
     description={`You don't have any tasks in the "${filter}" status.`}
     icon={Search}
    />
   ) : (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
     {filteredTasks.map((task) => (
      <TaskCard key={task._id} task={task} />
     ))}
    </div>
   )}
  </div>
 );
};

