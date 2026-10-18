import { Schema, model, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  description?: string;
  leader: Types.ObjectId; // reference to User
  hackathon: Types.ObjectId; // reference to Hackathon
  members: Types.ObjectId[]; // array of User IDs
  maxMembers: number;
  requiredSkills?: string[];
  preferredSkills?: string[];
  openRoles?: string[];
  projectIdea?: string;
  recruitmentDeadline?: Date;
  communicationPlatform?: string;
  visibility: 'Public' | 'Private';
  status: 'Open' | 'Full' | 'Closed' | 'Archived';
  aiMatchScore?: number; // placeholder
  compatibilityScore?: number; // placeholder
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true },
    description: String,
    leader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hackathon: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    maxMembers: { type: Number, required: true },
    requiredSkills: [String],
    preferredSkills: [String],
    openRoles: [String],
    projectIdea: String,
    recruitmentDeadline: Date,
    communicationPlatform: String,
    visibility: { type: String, enum: ['Public', 'Private'], default: 'Public' },
    status: { type: String, enum: ['Open', 'Full', 'Closed', 'Archived'], default: 'Open' },
    aiMatchScore: { type: Number, default: 0 },
    compatibilityScore: { type: Number, default: 0 }
  },
  { timestamps: true }
);

teamSchema.index({ hackathon: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ requiredSkills: 1 });
teamSchema.index({ status: 1 });

export const Team = model<ITeam>('Team', teamSchema);
