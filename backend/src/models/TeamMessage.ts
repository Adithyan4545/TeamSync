import { Schema, model, Document, Types } from 'mongoose';

export interface ITeamMessage extends Document {
  team: Types.ObjectId;
  sender?: Types.ObjectId;
  message: string;
  messageType: 'text' | 'system';
  readBy?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const teamMessageSchema = new Schema<ITeamMessage>(
  {
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    messageType: { type: String, enum: ['text', 'system'], default: 'text' },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

teamMessageSchema.index({ team: 1, createdAt: 1 });

export const TeamMessage = model<ITeamMessage>('TeamMessage', teamMessageSchema);
