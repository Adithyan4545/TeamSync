import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Calendar, ArrowLeft, Link as LinkIcon, Send } from 'lucide-react';
import Link from 'next/link';

interface StudentTaskWorkspaceProps {
 task: any;
 onSubmitWork: (data: any) => Promise<void>;
}

 export const StudentTaskWorkspace: React.FC<StudentTaskWorkspaceProps> = ({ task, onSubmitWork }) => {
  const [submissionType, setSubmissionType] = useState<'GitHub' | 'PDF' | 'ZIP'>('GitHub');
  const [githubUrl, setGithubUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const getFileUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${backendUrl}/${url}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   if (submissionType === 'GitHub' && !githubUrl) return;
   if ((submissionType === 'PDF' || submissionType === 'ZIP') && !file) return;
   
   setSubmitting(true);
   try {
    await onSubmitWork({
     submissionType,
     githubUrl: submissionType === 'GitHub' ? githubUrl : undefined,
     file: (submissionType === 'PDF' || submissionType === 'ZIP') ? file : undefined,
     notes,
    });
  } finally {
   setSubmitting(false);
  }
 };

 const formattedDate = task.deadline
  ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(task.deadline))
  : 'No deadline';

 const isSubmitted = task.status === 'Submitted' || task.status === 'Evaluated' || task.status === 'Accepted' || task.status === 'Closed';

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
      <Link href="/assignments" className="hover:text-primary transition-colors">My Tasks</Link> / Task Details
     </div>
     <h1 className="text-3xl font-bold text-foreground ">{task.title}</h1>
     <p className="text-primary font-medium mt-1">{task.team?.name}</p>
    </div>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
    <div className="md:col-span-2 space-y-6">
     <Card className="glass-card">
      <CardHeader className="border-b border-border dark:border-border">
       <CardTitle className="text-xl flex items-center gap-2">
        <span className="text-2xl">📋</span> Task Description
       </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
       <div className="prose dark:prose-invert max-w-none text-foreground dark:text-muted-foreground">
        {task.description ? (
         <p className="whitespace-pre-wrap">{task.description}</p>
        ) : (
         <p className="italic text-muted-foreground">No description provided.</p>
        )}
       </div>
      </CardContent>
     </Card>
    </div>

    <div className="space-y-6">
     <Card className="glass-card">
      <CardContent className="p-6 space-y-4">
       <div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
         <Calendar className="w-4 h-4" />
         Deadline
        </p>
        <p className="text-lg font-bold text-foreground ">{formattedDate}</p>
       </div>
       
       <div className="pt-4 border-t border-border dark:border-border">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
         Status
        </p>
        <div className="font-medium text-foreground ">
         {task.status}
        </div>
       </div>
      </CardContent>
     </Card>

     <Card className="glass-card overflow-hidden">
      <div className="bg-primary/5 border-b border-primary/10 p-4">
       <h3 className="font-bold text-lg flex items-center gap-2 text-primary">
        🔗 Submission
       </h3>
      </div>
      <CardContent className="p-6">
       {isSubmitted ? (
        <div className="space-y-4">
         <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 p-4 rounded-lg flex items-start gap-3">
          <span className="text-xl">✅</span>
          <div>
           <p className="font-bold">Work Submitted</p>
           <p className="text-sm mt-1 opacity-90">Waiting for leader review.</p>
          </div>
         </div>
         {task.submission && (
          <div className="pt-2 flex flex-col gap-2">
           {task.submission.githubUrl && (
            <a href={task.submission.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm font-medium">
             <LinkIcon className="w-4 h-4" />
             View GitHub Repository
            </a>
           )}
           {task.submission.fileUrl && (
            <a href={getFileUrl(task.submission.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline text-sm font-medium">
             <LinkIcon className="w-4 h-4" />
             View Attached File ({task.submission.submissionType})
            </a>
           )}
          </div>
         )}
        </div>
       ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
         <div className="space-y-2">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">Submission Type</label>
          <select 
           value={submissionType}
           onChange={(e) => { setSubmissionType(e.target.value as any); setFile(null); }}
           className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
           <option value="GitHub">GitHub Repository</option>
           <option value="PDF">PDF Document (File Upload)</option>
           <option value="ZIP">ZIP Archive (File Upload)</option>
          </select>
         </div>
         
         {submissionType === 'GitHub' ? (
          <div className="space-y-2">
           <label className="text-sm font-medium text-foreground dark:text-muted-foreground">GitHub Repository URL</label>
           <Input
            required
            placeholder="https://github.com/..."
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className="w-full"
           />
          </div>
         ) : (
          <div className="space-y-2">
           <label className="text-sm font-medium text-foreground dark:text-muted-foreground">Upload {submissionType} File</label>
           <Input
            type="file"
            required
            accept={submissionType === 'PDF' ? '.pdf' : '.zip,.rar,.tar.gz'}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:text-sm file:font-semibold hover:file:bg-primary/90 cursor-pointer"
           />
          </div>
         )}
         <div className="space-y-2">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">Notes (Optional)</label>
          <textarea
           className="w-full px-4 py-3 bg-muted/30 dark:bg-muted border border-border dark:border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none "
           rows={3}
           placeholder="Add any notes for your leader..."
           value={notes}
           onChange={(e) => setNotes(e.target.value)}
          />
         </div>
         <Button type="submit" className="w-full gap-2 mt-2" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Task'}
          <Send className="w-4 h-4" />
         </Button>
        </form>
       )}
      </CardContent>
     </Card>
    </div>
   </div>
  </div>
 );
};

