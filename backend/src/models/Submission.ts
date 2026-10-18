import { Schema, model, Document, Types } from 'mongoose';

export interface ISubmission extends Document {
  assignment: Types.ObjectId;
  user: Types.ObjectId;
  team: Types.ObjectId;
  submissionType: 'ZIP' | 'PDF' | 'GitHub';
  fileUrl?: string;
  githubUrl?: string;
  notes?: string;
  marks?: number;
  feedback?: string;
  status: 'Pending' | 'Submitted' | 'Late' | 'Evaluated' | 'Accepted' | 'Rejected' | 'Returned';
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    submissionType: { type: String, enum: ['ZIP', 'PDF', 'GitHub'], required: true },
    fileUrl: String,
    githubUrl: String,
    notes: String,
    marks: Number,
    feedback: String,
    status: {
      type: String,
      enum: ['Pending', 'Submitted', 'Late', 'Evaluated', 'Accepted', 'Rejected', 'Returned'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, user: 1 }, { unique: true });

export const Submission = model<ISubmission>('Submission', submissionSchema);
