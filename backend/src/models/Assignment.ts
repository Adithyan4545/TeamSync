import { Schema, model, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description?: string;
  team: Types.ObjectId;
  createdBy: Types.ObjectId;
  assignedTo?: Types.ObjectId; // reference to assigned team member
  deadline?: Date;
  totalMarks?: number;
  fileAttachmentUrl?: string;
  allowedFileTypes?: string[];
  status?: 'Draft' | 'Published' | 'Open' | 'Assigned' | 'In Progress' | 'Submitted' | 'Accepted' | 'Rejected' | 'Closed' | 'Evaluated' | 'Archived';
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<IAssignment>(
  {
    title: { type: String, required: true },
    description: String,
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    deadline: Date,
    totalMarks: { type: Number, default: 100 },
    fileAttachmentUrl: String,
    allowedFileTypes: [{ type: String }],
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Open', 'Assigned', 'In Progress', 'Submitted', 'Accepted', 'Rejected', 'Closed', 'Evaluated', 'Archived'],
      default: 'Assigned',
    },
  },
  { timestamps: true }
);

assignmentSchema.index({ team: 1 });
assignmentSchema.index({ assignedTo: 1 });

export const Assignment = model<IAssignment>('Assignment', assignmentSchema);
