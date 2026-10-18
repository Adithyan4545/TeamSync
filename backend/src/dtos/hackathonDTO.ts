export interface CreateHackathonDTO {
  title: string;
  description?: string;
  organizer?: string;
  theme?: string;
  difficulty?: string;
  prize?: number;
  registrationDeadline?: string; // ISO date string
  eventDate?: string;
  venue?: string;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  minTeamSize?: number;
  maxTeamSize?: number;
  requiredSkills?: string[];
  eligibility?: string;
  registrationFee?: number;
  registrationLink?: string;
  officialWebsite?: string;
  contactEmail?: string;
  contactPhone?: string;
  bannerImagePath?: string;
  tags?: string[];
  sdgs?: string[];
  status?: 'Upcoming' | 'Registration Open' | 'Ongoing' | 'Closed' | 'Completed';
}

export interface UpdateHackathonDTO extends Partial<CreateHackathonDTO> {}

export interface HackathonResponseDTO {
  _id: string;
  title: string;
  description?: string;
  organizer?: string;
  theme?: string;
  difficulty?: string;
  prize?: number;
  registrationDeadline?: string;
  eventDate?: string;
  venue?: string;
  mode?: string;
  minTeamSize?: number;
  maxTeamSize?: number;
  requiredSkills?: string[];
  eligibility?: string;
  registrationFee?: number;
  registrationLink?: string;
  officialWebsite?: string;
  contactEmail?: string;
  contactPhone?: string;
  bannerImagePath?: string;
  tags?: string[];
  sdgs?: string[];
  status?: string;
  popularityScore?: number;
  recommendationScore?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
