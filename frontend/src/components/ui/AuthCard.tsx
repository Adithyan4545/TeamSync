import React, { ReactNode } from 'react';

/**
 * Card wrapper used inside AuthLayout for forms.
 */
export default function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-full space-y-8">
      {children}
    </div>
  );
}
