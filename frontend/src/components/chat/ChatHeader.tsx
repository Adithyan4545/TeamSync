import React from 'react';
import { Users } from 'lucide-react';

interface ChatHeaderProps {
  teamName: string;
  onlineCount: number;
}

export default function ChatHeader({ teamName, onlineCount }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm rounded-t-lg">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground flex items-center space-x-2">
            <span>{teamName}</span>
          </h3>
          <p className="text-xs text-muted-foreground flex items-center space-x-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>{onlineCount} online</span>
          </p>
        </div>
      </div>
    </div>
  );
}
