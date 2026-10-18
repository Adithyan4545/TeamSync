import { Schema, model, Document } from 'mongoose';

export interface ILocationDetails {
  city?: string | null;
  state?: string | null;
  country?: string | null;
  venue?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface IExternalHackathon extends Document {
  externalId: string;
  title: string;
  description?: string;
  organizer?: string;
  location?: string;
  locationDetails?: ILocationDetails;
  mode?: 'Online' | 'Offline' | 'Hybrid';
  registrationDeadline?: Date;
  eventDate?: Date; // Kept for backward compatibility
  eventStartDate?: Date;
  eventEndDate?: Date;
  prize?: number;
  image?: string;
  officialUrl: string;
  tags?: string[];
  lastSynced?: Date;
  registrationFeeType?: 'free' | 'paid' | 'unknown';
  registrationFee?: number | null;
  currency?: string | null;
  eligibilityType?: 'students' | 'college_students' | 'working_professionals' | 'open_to_everyone' | 'unknown';
  eligibilityText?: string | null;
  domains?: string[];
  status?: 'Upcoming' | 'Registration Open' | 'Ongoing' | 'Closed' | 'Completed';
  source: 'external';
  sourceProvider?: string;
  sourceProviders?: string[];
  sourceType?: 'platform' | 'college' | 'company' | 'community';
  canonicalUrl?: string;
  discoveryDate?: Date;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const externalHackathonSchema = new Schema<IExternalHackathon>(
  {
    externalId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, index: true },
    description: String,
    organizer: String,
    location: String,
    locationDetails: {
      city: { type: String, default: null, index: true },
      state: { type: String, default: null, index: true },
      country: { type: String, default: null, index: true },
      venue: { type: String, default: null },
      address: { type: String, default: null },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    mode: { type: String, enum: ['Online', 'Offline', 'Hybrid'], default: 'Online' },
    registrationDeadline: Date,
    eventDate: Date,
    eventStartDate: Date,
    eventEndDate: Date,
    prize: Number,
    registrationFeeType: {
      type: String,
      enum: ['free', 'paid', 'unknown'],
      default: 'unknown',
      index: true,
    },
    registrationFee: { type: Number, default: null },
    currency: { type: String, default: null },
    eligibilityType: {
      type: String,
      enum: ['students', 'college_students', 'working_professionals', 'open_to_everyone', 'unknown'],
      default: 'unknown',
      index: true,
    },
    eligibilityText: { type: String, default: null },
    domains: { type: [String], default: [], index: true },
    image: String,
    officialUrl: { type: String, required: true },
    canonicalUrl: String,
    tags: [String],
    sourceProvider: { type: String, default: 'unstop', index: true },
    sourceProviders: { type: [String], default: ['unstop'], index: true },
    sourceType: {
      type: String,
      enum: ['platform', 'college', 'company', 'community'],
      default: 'platform',
      index: true,
    },
    discoveryDate: { type: Date, default: Date.now },
    lastSyncedAt: { type: Date, default: Date.now },
    lastSynced: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Upcoming', 'Registration Open', 'Ongoing', 'Closed', 'Completed'],
      default: 'Registration Open',
    },
    source: { type: String, default: 'external' },
  },
  { timestamps: true }
);

externalHackathonSchema.index({ title: 'text', description: 'text', tags: 'text', organizer: 'text' });

export const ExternalHackathon = model<IExternalHackathon>('ExternalHackathon', externalHackathonSchema);
