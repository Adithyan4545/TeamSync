import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

interface TeamFiltersProps {
  filters: any;
  onChange: (newFilters: any) => void;
  onReset: () => void;
}

export const TeamFilters: React.FC<TeamFiltersProps> = ({ filters, onChange, onReset }) => {
  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center space-x-2 font-bold text-foreground">
          <Filter className="w-5 h-5 text-primary" />
          <span className="tracking-tight">Team Filters</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* Status */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">Team Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => onChange({ status: e.target.value || undefined, page: 1 })}
            className="w-full h-11 bg-background/50 border border-input rounded-xl px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none transition-shadow"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open (Looking for members)</option>
            <option value="Full">Full</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* Skill search */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-2">Filter by Skill</label>
          <input
            type="text"
            placeholder="e.g. React, Python, Figma"
            value={filters.requiredSkills?.join(',') || ''}
            onChange={(e) =>
              onChange({
                requiredSkills: e.target.value ? e.target.value.split(',') : undefined,
                page: 1,
              })
            }
            className="w-full h-11 bg-background/50 border border-input rounded-xl px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none transition-shadow"
          />
        </div>
      </div>
    </div>
  );
};
