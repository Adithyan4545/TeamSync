import React from 'react';

interface RegistrationStatusBadgeProps {
  status?: string;
  deadline?: string;
}

export const RegistrationStatusBadge: React.FC<RegistrationStatusBadgeProps> = ({ status, deadline }) => {
  let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  let label = status || 'Upcoming';

  if (deadline) {
    const isPast = new Date(deadline).getTime() < Date.now();
    if (isPast && status !== 'Completed') {
      label = 'Registration Closed';
      colorClass = 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    } else if (status === 'Registration Open') {
      colorClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
    } else if (status === 'Ongoing') {
      colorClass = 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorClass}`}>
      {label}
    </span>
  );
};
