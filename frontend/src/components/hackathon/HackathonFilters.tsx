import React, { useEffect, useState } from 'react';
import { Filter, RotateCcw, MapPin, Globe2 } from 'lucide-react';
import api from '@/lib/axios';

interface HackathonFiltersProps {
  filters: any;
  onChange: (newFilters: any) => void;
  onReset: () => void;
}

export const HackathonFilters: React.FC<HackathonFiltersProps> = ({ filters, onChange, onReset }) => {
  const [locationOptions, setLocationOptions] = useState<{
    states: string[];
    cities: Record<string, string[]>;
  }>({ states: [], cities: {} });

  useEffect(() => {
    async function fetchLocationOptions() {
      try {
        const res = await api.get('/hackathons/location-options');
        if (res.data && res.data.success) {
          setLocationOptions({
            states: res.data.states || [],
            cities: res.data.cities || {},
          });
        }
      } catch (err) {
        console.warn('Failed to load location options:', err);
      }
    }
    fetchLocationOptions();
  }, []);

  const selectedState = filters.state || 'all';

  // Compute cities list based on state selection
  let availableCities: string[] = [];
  if (selectedState !== 'all' && locationOptions.cities[selectedState]) {
    availableCities = locationOptions.cities[selectedState];
  } else {
    const allCitiesSet = new Set<string>();
    Object.values(locationOptions.cities).forEach((cList) => cList.forEach((c) => allCitiesSet.add(c)));
    availableCities = Array.from(allCitiesSet).sort();
  }

  const handleStateChange = (newState: string) => {
    if (newState === 'all') {
      onChange({ state: undefined, city: undefined, page: 1 });
    } else {
      const stateCities = locationOptions.cities[newState] || [];
      const currentCity = filters.city;
      const validCity = currentCity && stateCities.includes(currentCity) ? currentCity : undefined;
      onChange({ state: newState, city: validCity, page: 1 });
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 font-bold text-foreground text-sm uppercase tracking-wider">
          <Filter className="w-4 h-4 text-primary" />
          <span>Filters</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center space-x-1 bg-background/50 px-3 py-1.5 rounded-lg border border-border hover:border-primary/50"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {/* Source Provider Filter */}
        <select
          value={filters.sourceProvider || 'all'}
          onChange={(e) => onChange({ sourceProvider: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="all">🌐 All Platforms</option>
          <option value="unstop">Unstop</option>
          <option value="devfolio">Devfolio</option>
          <option value="hackerearth">HackerEarth</option>
          <option value="mlh">MLH</option>
          <option value="devpost">Devpost</option>
          <option value="hackerrank">HackerRank</option>
          <option value="college">🏫 Indian Colleges</option>
          <option value="company">🏢 Tech Companies</option>
        </select>

        {/* Source Type Filter */}
        <select
          value={filters.sourceType || 'all'}
          onChange={(e) => onChange({ sourceType: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="all">📁 All Categories</option>
          <option value="platform">🌍 Platforms</option>
          <option value="college">🏫 College Events</option>
          <option value="company">🏢 Company Challenges</option>
        </select>

        {/* State / Location */}
        <select
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="all">📍 All India (States)</option>
          {locationOptions.states.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* City Filter */}
        <select
          value={filters.city || 'all'}
          onChange={(e) => onChange({ city: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="all">🏙️ All Cities</option>
          {availableCities.map((ct) => (
            <option key={ct} value={ct}>
              {ct}
            </option>
          ))}
        </select>

        {/* Time Window */}
        <select
          value={filters.upcomingWindow || '35days'}
          onChange={(e) => onChange({ upcomingWindow: e.target.value, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="35days">📅 Next 35 Days</option>
          <option value="all">📅 All Upcoming</option>
        </select>

        {/* Mode */}
        <select
          value={filters.mode || ''}
          onChange={(e) => onChange({ mode: e.target.value || undefined, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="">🏠 All Modes</option>
          <option value="Online">💻 Online</option>
          <option value="Offline">🏢 Offline</option>
          <option value="Hybrid">🔄 Hybrid</option>
        </select>

        {/* Registration Fee Filter */}
        <select
          value={filters.registrationFee || 'all'}
          onChange={(e) => onChange({ registrationFee: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="all">💰 All Fees</option>
          <option value="free">🎉 Free Only</option>
          <option value="paid">💳 Paid Only</option>
        </select>

        {/* Eligibility */}
        <select
          value={filters.eligibility || 'all'}
          onChange={(e) => onChange({ eligibility: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="all">👥 All Participants</option>
          <option value="students">🎒 Students</option>
          <option value="college_students">🎓 College Students</option>
          <option value="working_professionals">💼 Professionals</option>
          <option value="open_to_everyone">🌐 Open to All</option>
        </select>

        {/* Domain / Technology */}
        <select
          value={filters.domain || 'all'}
          onChange={(e) => onChange({ domain: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="all">⚙️ All Domains</option>
          <option value="AI/ML">🤖 AI / ML</option>
          <option value="Web Development">🌐 Web Dev</option>
          <option value="Mobile Development">📱 Mobile Dev</option>
          <option value="Blockchain">⛓️ Blockchain</option>
          <option value="Cybersecurity">🔒 Security</option>
          <option value="IoT">🔌 IoT</option>
          <option value="Cloud">☁️ Cloud</option>
          <option value="Data Science">📊 Data Science</option>
          <option value="Open Source">🔓 Open Source</option>
          <option value="AR/VR">🕶️ AR / VR</option>
          <option value="Game Development">🎮 Game Dev</option>
          <option value="FinTech">💸 FinTech</option>
          <option value="EdTech">📚 EdTech</option>
          <option value="HealthTech">🏥 HealthTech</option>
          <option value="Other">More</option>
        </select>

        {/* Difficulty */}
        <select
          value={filters.difficulty || ''}
          onChange={(e) => onChange({ difficulty: e.target.value || undefined, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="">📈 All Levels</option>
          <option value="Beginner">🌱 Beginner</option>
          <option value="Intermediate">🚀 Intermediate</option>
          <option value="Advanced">⭐ Advanced</option>
        </select>

        {/* Status */}
        <select
          value={filters.status || ''}
          onChange={(e) => onChange({ status: e.target.value || undefined, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium appearance-none"
        >
          <option value="">🟢 All Statuses</option>
          <option value="Registration Open">🔓 Reg Open</option>
          <option value="Upcoming">⏳ Upcoming</option>
          <option value="Ongoing">▶️ Ongoing</option>
          <option value="Closed">🔒 Closed</option>
        </select>

        {/* Min Prize */}
        <input
          type="number"
          placeholder="🏆 Min Prize ($)"
          value={filters.minPrize || ''}
          onChange={(e) => onChange({ minPrize: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
          className="w-full h-10 bg-background/40 border border-input rounded-xl px-3 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all font-medium"
        />
      </div>
    </div>
  );
};
