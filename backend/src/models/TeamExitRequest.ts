import { Schema, model, Document, Types } from 'mongoose';

export interface ITeamExitRequest extends Document {
  team: Types.ObjectId;
  member: Types.ObjectId;
  roleAtExit?: string;
  skillsAtExit?: string[];
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const teamExitRequestSchema = new Schema<ITeamExitRequest>(
  {
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    member: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    roleAtExit: { type: String, default: 'Backend Developer' },
    skillsAtExit: [{ type: String }],
    reason: String,
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
  },
  { timestamps: true }
);

teamExitRequestSchema.index({ team: 1, member: 1, status: 1 });

export const TeamExitRequest = model<ITeamExitRequest>('TeamExitRequest', teamExitRequestSchema);
