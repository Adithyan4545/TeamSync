import { Schema, model, Document, Types } from 'mongoose';

export interface ITeamRequest extends Document {
  user: Types.ObjectId; // applicant
  team: Types.ObjectId;
  message?: string;
  status: 'Pending' | 'Shortlisted' | 'Accepted' | 'Rejected' | 'Withdrawn' | 'Cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const teamRequestSchema = new Schema<ITeamRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    message: String,
    status: { type: String, enum: ['Pending', 'Shortlisted', 'Accepted', 'Rejected', 'Withdrawn', 'Cancelled'], default: 'Pending' }
  },
  { timestamps: true }
);

teamRequestSchema.index({ user: 1, team: 1 }, { unique: true });

export const TeamRequest = model<ITeamRequest>('TeamRequest', teamRequestSchema);
