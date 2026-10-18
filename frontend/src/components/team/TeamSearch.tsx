import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface TeamSearchProps {
  value: string;
  onChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
}

export const TeamSearch: React.FC<TeamSearchProps> = ({
  value,
  onChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 glass-card p-3" >
      <div className="relative flex-grow w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by team name, idea, or role..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-background/50 border border-input rounded-xl text-sm focus:ring-2 focus:ring-ring focus:outline-none transition-shadow placeholder:text-muted-foreground/70"
        />
      </div>

      <div className="flex items-center space-x-3 w-full md:w-auto px-1">
        <div className="flex items-center text-muted-foreground">
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium whitespace-nowrap">Sort by</span>
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full md:w-48 bg-background/50 border border-input rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none transition-shadow"
        >
          <option value="createdAt">Recently Created</option>
          <option value="openPositions">Most Open Spots</option>
        </select>
      </div>
    </div>
  );
};
