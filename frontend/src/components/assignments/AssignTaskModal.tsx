import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AssignTaskModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSubmit: (task: any) => Promise<void>;
 members: any[];
 teamId: string;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({ isOpen, onClose, onSubmit, members, teamId }) => {
 const [formData, setFormData] = useState({
  title: '',
  assignedTo: '',
  description: '',
  deadline: '',
  teamId: teamId
 });
 const [loading, setLoading] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
   await onSubmit(formData);
   setFormData({ title: '', assignedTo: '', description: '', deadline: '', teamId });
   onClose();
  } catch (error) {
   // Error handled by parent
  } finally {
   setLoading(false);
  }
 };

 if (!isOpen) return null;

 return (
  <AnimatePresence>
   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <motion.div
     initial={{ opacity: 0, scale: 0.95 }}
     animate={{ opacity: 1, scale: 1 }}
     exit={{ opacity: 0, scale: 0.95 }}
     className="bg-white dark:bg-accent rounded-2xl w-full max-w-md shadow-2xl border border-border dark:border-border overflow-hidden"
    >
     <div className="flex justify-between items-center p-5 border-b border-border dark:border-border">
      <h2 className="text-xl font-bold text-foreground ">Assign Task</h2>
      <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground dark:hover:text-slate-200 transition-colors">
       <X className="w-5 h-5" />
      </button>
     </div>

     <form onSubmit={handleSubmit} className="p-6 space-y-5">
      <div className="space-y-2">
       <label className="text-sm font-medium text-foreground dark:text-muted-foreground">Task Title</label>
       <Input
        required
        placeholder="e.g. Build Login Page"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full"
       />
      </div>

      <div className="space-y-2">
       <label className="text-sm font-medium text-foreground dark:text-muted-foreground">Assign To</label>
       <select
        required
        className="w-full px-4 py-2 bg-muted/30 dark:bg-muted border border-border dark:border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all "
        value={formData.assignedTo}
        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
       >
        <option value="" disabled>Select Team Member</option>
        {members.map(m => (
         <option key={m._id} value={m._id}>{m.name}</option>
        ))}
       </select>
      </div>

      <div className="space-y-2">
       <label className="text-sm font-medium text-foreground dark:text-muted-foreground">Description</label>
       <textarea
        className="w-full px-4 py-3 bg-muted/30 dark:bg-muted border border-border dark:border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none "
        rows={3}
        placeholder="Briefly describe the requirements..."
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
       />
      </div>

      <div className="space-y-2">
       <label className="text-sm font-medium text-foreground dark:text-muted-foreground">Deadline</label>
       <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
         required
         type="date"
         value={formData.deadline}
         onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
         className="w-full pl-10"
        />
       </div>
      </div>

      <div className="pt-2 flex justify-end gap-3 border-t border-border dark:border-border mt-6">
       <Button type="button" variant="outline" onClick={onClose}>
        Cancel
       </Button>
       <Button type="submit" disabled={loading}>
        {loading ? 'Assigning...' : 'Assign Task'}
       </Button>
      </div>
     </form>
    </motion.div>
   </div>
  </AnimatePresence>
 );
};

