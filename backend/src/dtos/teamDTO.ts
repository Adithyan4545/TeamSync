export interface CreateTeamDTO {
  name: string;
  description?: string;
  hackathon: string; // Hackathon ID
  maxMembers: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
  openRoles?: string[];
  projectIdea?: string;
  recruitmentDeadline?: string; // ISO date
  communicationPlatform?: string;
  visibility?: 'Public' | 'Private';
  status?: 'Open' | 'Full' | 'Closed';
}

export interface UpdateTeamDTO extends Partial<CreateTeamDTO> {}

export interface TeamResponseDTO {
  _id: string;
  name: string;
  description?: string;
  leader: string;
  hackathon: string;
  members: string[];
  maxMembers: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
  openRoles?: string[];
  projectIdea?: string;
  recruitmentDeadline?: string;
  communicationPlatform?: string;
  visibility: string;
  status: string;
  aiMatchScore?: number;
  compatibilityScore?: number;
  createdAt: string;
  updatedAt: string;
}
