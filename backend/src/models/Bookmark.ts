import { Schema, model, Document, Types } from 'mongoose';

export interface IBookmark extends Document {
  user: Types.ObjectId; // reference to User
  hackathon?: Types.ObjectId; // reference to Hackathon (optional)
  team?: Types.ObjectId; // reference to Team (optional)
  createdAt: Date;
}

const bookmarkSchema = new Schema<IBookmark>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    hackathon: { type: Schema.Types.ObjectId, ref: 'Hackathon' },
    team: { type: Schema.Types.ObjectId, ref: 'Team' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

bookmarkSchema.index({ user: 1, hackathon: 1 }, { unique: true, partialFilterExpression: { hackathon: { $exists: true } } });
bookmarkSchema.index({ user: 1, team: 1 }, { unique: true, partialFilterExpression: { team: { $exists: true } } });

export const Bookmark = model<IBookmark>('Bookmark', bookmarkSchema);
