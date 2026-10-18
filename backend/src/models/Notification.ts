import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId; // recipient
  type:
    | 'HackathonPublished'
    | 'RegistrationClosing'
    | 'JoinRequestSent'
    | 'JoinRequestReceived'
    | 'JoinRequestAccepted'
    | 'JoinRequestRejected'
    | 'TeamUpdated'
    | 'TeamFull'
    | 'AssignmentCreated'
    | 'AssignmentUpdated'
    | 'AssignmentDeleted'
    | 'DeadlineReminder'
    | 'SubmissionReceived'
    | 'AssignmentSubmitted'
    | 'SubmissionUpdated'
    | 'MarksPublished'
    | 'FeedbackAdded'
    | 'MemberExitRequested'
    | 'MemberExitApproved'
    | 'MemberExitRejected'
    | 'ReplacementRoleOpened';
  payload: any; // flexible data per type
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'HackathonPublished',
        'RegistrationClosing',
        'JoinRequestSent',
        'JoinRequestReceived',
        'JoinRequestAccepted',
        'JoinRequestRejected',
        'TeamUpdated',
        'TeamFull',
        'AssignmentCreated',
        'AssignmentUpdated',
        'AssignmentDeleted',
        'DeadlineReminder',
        'SubmissionReceived',
        'AssignmentSubmitted',
        'SubmissionUpdated',
        'MarksPublished',
        'FeedbackAdded',
        'MemberExitRequested',
        'MemberExitApproved',
        'MemberExitRejected',
        'ReplacementRoleOpened',
      ],
      required: true,
    },
    payload: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = model<INotification>('Notification', notificationSchema);
