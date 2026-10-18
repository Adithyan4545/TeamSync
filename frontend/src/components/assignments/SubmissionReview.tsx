import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, CheckCircle, RefreshCcw, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';

interface SubmissionReviewProps {
 task: any;
 submission: any;
 onEvaluate: (data: { marks: number; feedback: string; status: 'Accepted' | 'Rejected' }) => Promise<void>;
}

export const SubmissionReview: React.FC<SubmissionReviewProps> = ({ task, submission, onEvaluate }) => {
 const [marks, setMarks] = useState<number>(submission?.marks || 0);
 const [feedback, setFeedback] = useState(submission?.feedback || '');
 const [submitting, setSubmitting] = useState(false);

 const getFileUrl = (url: string) => {
   if (url.startsWith('http')) return url;
   const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
   return `${backendUrl}/${url}`;
 };

 const getInitials = (name?: string) => {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
 };

 const [evaluating, setEvaluating] = useState(false);

 const handleEvaluate = async (status: 'Accepted' | 'Rejected') => {
  if (status === 'Accepted' && !feedback.trim()) {
   alert('Please provide some feedback');
   return;
  }
  
  setEvaluating(true);
  try {
   await onEvaluate({
    marks: Number(marks) || 0,
    feedback,
    status,
   });
  } finally {
   setEvaluating(false);
  }
 };

 const isEvaluated = submission?.status === 'Evaluated' || submission?.status === 'Accepted' || submission?.status === 'Rejected' || task?.status === 'Closed';

 return (
  <div className="space-y-6 max-w-4xl mx-auto">
   <div className="flex items-center gap-4">
    <Link href="/assignments">
     <Button variant="outline" size="icon" className="rounded-full">
      <ArrowLeft className="w-4 h-4" />
     </Button>
    </Link>
    <div>
     <div className="text-sm font-medium text-muted-foreground mb-1">
      <Link href="/assignments" className="hover:text-primary transition-colors">Team Tasks</Link> / Review Submission
     </div>
     <h1 className="text-3xl font-bold text-foreground ">Review Submission</h1>
    </div>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
    <div className="md:col-span-2 space-y-6">
     <Card className="border border-border dark:border-border bg-white dark:bg-accent">
      <CardHeader className="border-b border-border dark:border-border">
       <CardTitle className="text-xl flex items-center gap-2">
        <span className="text-2xl">📝</span> Task Details
       </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
       <h3 className="font-bold text-lg text-foreground mb-2">{task.title}</h3>
       <div className="prose dark:prose-invert max-w-none text-foreground dark:text-muted-foreground">
        <p className="whitespace-pre-wrap">{task.description}</p>
       </div>
      </CardContent>
     </Card>

     <Card className="border border-border dark:border-border bg-white dark:bg-accent">
      <CardContent className="p-6">
       <h3 className="font-bold text-lg text-foreground mb-4">Student Submission</h3>
       
       {!submission ? (
        <div className="bg-muted/30 dark:bg-muted/50 rounded-lg p-6 text-center border border-border dark:border-border">
         <p className="text-muted-foreground italic">No submission received yet.</p>
        </div>
       ) : (
        <div className="space-y-4">
         {submission.githubUrl && (
          <div className="bg-muted/30 dark:bg-muted rounded-lg p-4 flex items-center justify-between border border-border dark:border-border">
           <div className="flex items-center gap-3">
            <LinkIcon className="w-6 h-6 text-foreground dark:text-muted-foreground" />
            <div>
             <p className="font-semibold text-foreground ">GitHub Repository</p>
             <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
              {submission.githubUrl}
             </a>
            </div>
           </div>
           <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">Open GitHub →</Button>
           </a>
          </div>
         )}

         {submission.fileUrl && (
          <div className="bg-muted/30 dark:bg-muted rounded-lg p-4 flex items-center justify-between border border-border dark:border-border mt-4">
           <div className="flex items-center gap-3">
            <LinkIcon className="w-6 h-6 text-foreground dark:text-muted-foreground" />
            <div>
             <p className="font-semibold text-foreground ">Attached File ({submission.submissionType})</p>
             <a href={getFileUrl(submission.fileUrl)} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
              Download File
             </a>
            </div>
           </div>
           <a href={getFileUrl(submission.fileUrl)} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">Open File →</Button>
           </a>
          </div>
         )}

         {submission.notes && (
          <div>
           <p className="text-sm font-semibold text-foreground dark:text-muted-foreground mb-2">Student Notes:</p>
           <div className="bg-muted/30 dark:bg-muted p-4 rounded-lg text-foreground dark:text-muted-foreground border border-border dark:border-border italic">
            "{submission.notes}"
           </div>
          </div>
         )}
        </div>
       )}
      </CardContent>
     </Card>
    </div>

    <div className="space-y-6">
     <Card className="border border-border dark:border-border bg-white dark:bg-accent">
      <CardContent className="p-6">
       <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
        Submitted by
       </p>
       <div className="flex items-center gap-3">
        <Avatar src={task.assignedTo?.avatarUrl} fallback={getInitials(task.assignedTo?.name)} className="h-12 w-12 border border-border dark:border-border" size="lg" />
        <div>
         <p className="font-bold text-foreground ">{task.assignedTo?.name}</p>
        </div>
       </div>
      </CardContent>
     </Card>

     {submission && !isEvaluated && (
      <Card className="border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 overflow-hidden">
       <div className="bg-primary/10 p-4 border-b border-primary/20">
        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
         <span>⚖️</span> Evaluation
        </h3>
       </div>
       <CardContent className="p-6 space-y-4">

        <div className="space-y-2">
         <label className="text-sm font-medium text-foreground dark:text-muted-foreground">Feedback</label>
         <textarea
          className="w-full px-4 py-3 bg-white dark:bg-muted border border-border dark:border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none "
          rows={4}
          placeholder="Great implementation. Improve form validation..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
         />
        </div>
        
        <div className="pt-2 flex flex-col gap-3">
         <Button 
          className="w-full gap-2" 
          disabled={evaluating} 
          onClick={() => handleEvaluate('Accepted')}
         >
          {evaluating ? 'Processing...' : 'Accept Submission'}
          <CheckCircle className="w-4 h-4" />
         </Button>
         <Button 
          variant="outline" 
          className="w-full gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
          disabled={evaluating}
          onClick={() => handleEvaluate('Rejected')}
         >
          Request Revision
          <RefreshCcw className="w-4 h-4" />
         </Button>
        </div>
       </CardContent>
      </Card>
     )}

     {isEvaluated && (
      <Card className="border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
       <CardContent className="p-6 space-y-4 text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-300 mb-2">
         <CheckCircle className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-lg text-green-800 dark:text-green-300">Evaluation Complete</h3>
        
        <div className="bg-white dark:bg-accent rounded-lg p-4 border border-green-100 dark:border-green-800 text-left mt-4">
         <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Feedback</p>
         <p className="text-foreground dark:text-muted-foreground italic">"{submission.feedback}"</p>
        </div>
       </CardContent>
      </Card>
     )}
    </div>
   </div>
  </div>
 );
};

