import { ILocationDetails } from '../../models/ExternalHackathon';

export interface ExternalHackathonInput {
  externalId: string;
  title: string;
  description: string;
  organizer: string;
  location?: string;
  locationDetails?: ILocationDetails;
  mode: 'Online' | 'Offline' | 'Hybrid';
  registrationDeadline?: Date;
  eventDate?: Date;
  eventStartDate?: Date;
  eventEndDate?: Date;
  prize?: number;
  image?: string;
  officialUrl: string;
  registrationFeeType?: 'free' | 'paid' | 'unknown';
  registrationFee?: number | null;
  currency?: string | null;
  eligibilityType?: 'students' | 'college_students' | 'working_professionals' | 'open_to_everyone' | 'unknown';
  eligibilityText?: string | null;
  domains?: string[];
  tags?: string[];
  status?: 'Upcoming' | 'Registration Open' | 'Ongoing' | 'Closed' | 'Completed';
  sourceProvider?: string;
  sourceType?: 'platform' | 'college' | 'company' | 'community';
  canonicalUrl?: string;
}

export interface ExternalHackathonProvider {
  name: string;
  isEnabled(): boolean;
  fetchHackathons(): Promise<ExternalHackathonInput[]>;
}
