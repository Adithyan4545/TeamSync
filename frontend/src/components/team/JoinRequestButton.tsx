import React, { useState } from 'react';
import { UserPlus, Check, Clock, Crown } from 'lucide-react';

interface JoinRequestButtonProps {
  status?: 'Pending' | 'Accepted' | 'Rejected' | 'Shortlisted' | 'Leader' | null;
  onSend: () => Promise<void>;
  onCancel: () => Promise<void>;
}

export const JoinRequestButton: React.FC<JoinRequestButtonProps> = ({
  status,
  onSend,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onSend();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onCancel();
    } finally {
      setLoading(false);
    }
  };

  if (status === 'Leader') {
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
        <Crown className="w-3.5 h-3.5 text-purple-400" />
        <span>Leader</span>
      </span>
    );
  }

  if (status === 'Accepted') {
    return (
      <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span>Member</span>
      </span>
    );
  }

  if (status === 'Pending' || status === 'Shortlisted') {
    return (
      <button
        onClick={handleCancel}
        disabled={loading}
        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-colors"
      >
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        <span>{loading ? 'Cancelling...' : 'Cancel Request'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
    >
      <UserPlus className="w-4 h-4" />
      <span>{loading ? 'Sending...' : 'Request to Join'}</span>
    </button>
  );
};
