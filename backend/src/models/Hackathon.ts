import { Schema, model, Document, Types } from 'mongoose';
import { ILocationDetails } from './ExternalHackathon';

export interface IHackathon extends Document {
  title: string;
  description?: string;
  organizer?: string;
  theme?: string;
  difficulty?: string;
  prize?: number;
  registrationDeadline?: Date;
  eventDate?: Date;
  venue?: string;
  locationDetails?: ILocationDetails;
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
  popularityScore?: number;
  recommendationScore?: number;
  source?: 'community' | 'external';
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const hackathonSchema = new Schema<IHackathon>(
  {
    title: { type: String, required: true, index: true },
    description: String,
    organizer: String,
    theme: String,
    difficulty: String,
    prize: Number,
    registrationDeadline: Date,
    eventDate: Date,
    venue: String,
    locationDetails: {
      city: { type: String, default: null, index: true },
      state: { type: String, default: null, index: true },
      country: { type: String, default: null, index: true },
      venue: { type: String, default: null },
      address: { type: String, default: null },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    mode: { type: String, enum: ['Online', 'Offline', 'Hybrid'] },
    minTeamSize: Number,
    maxTeamSize: Number,
    requiredSkills: [String],
    eligibility: String,
    registrationFee: Number,
    registrationLink: String,
    officialWebsite: String,
    contactEmail: String,
    contactPhone: String,
    bannerImagePath: String,
    tags: [String],
    sdgs: [String],
    status: {
      type: String,
      enum: ['Upcoming', 'Registration Open', 'Ongoing', 'Closed', 'Completed'],
      default: 'Upcoming',
    },
    popularityScore: { type: Number, default: 0 },
    recommendationScore: { type: Number, default: 0 },
    source: { type: String, default: 'community' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

hackathonSchema.index({ title: 'text', description: 'text', tags: 'text' });

export const Hackathon = model<IHackathon>('Hackathon', hackathonSchema);
