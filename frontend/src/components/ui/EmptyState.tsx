import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-border/60 bg-background/50 backdrop-blur-sm w-full max-w-xl mx-auto"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-bold text-foreground tracking-tight mb-2">{title}</h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </motion.div>
  );
}
