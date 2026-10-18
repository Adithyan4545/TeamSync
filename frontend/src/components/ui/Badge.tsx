import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-primary/10 text-primary hover:bg-primary/20',
    secondary: 'border-transparent bg-secondary/10 text-secondary hover:bg-secondary/20',
    outline: 'text-foreground border-border',
    destructive: 'border-transparent bg-danger/10 text-danger hover:bg-danger/20',
    success: 'border-transparent bg-success/10 text-success hover:bg-success/20',
    warning: 'border-transparent bg-warning/10 text-warning hover:bg-warning/20',
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
