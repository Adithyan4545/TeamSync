import React from 'react';
import { Crown, Mail, School } from 'lucide-react';

interface TeamLeaderCardProps {
  leader: any;
}

export const TeamLeaderCard: React.FC<TeamLeaderCardProps> = ({ leader }) => {
  if (!leader) return null;

  return (
    <div className="bg-card border rounded-xl p-4 flex items-center space-x-4 shadow-sm">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
          {leader.name ? leader.name[0].toUpperCase() : 'L'}
        </div>
        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5">
          <Crown className="w-3 h-3" />
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Team Leader
        </div>
        <h4 className="font-bold text-foreground text-base">{leader.name || 'Anonymous Leader'}</h4>
        {leader.email && (
          <p className="text-xs text-muted-foreground flex items-center space-x-1 mt-0.5">
            <Mail className="w-3 h-3" />
            <span>{leader.email}</span>
          </p>
        )}
      </div>
    </div>
  );
};
