import { Schema, model, Document } from 'mongoose';

export interface IProviderStatus {
  status: 'success' | 'failed';
  fetched?: number;
  inserted?: number;
  updated?: number;
  duplicates?: number;
  error?: string;
}

export interface ISyncAudit extends Document {
  syncStartedAt: Date;
  syncCompletedAt: Date;
  totalActiveHackathons: number;
  newRecords: number;
  updatedRecords: number;
  duplicatesPrevented: number;
  closedRecords: number;
  registrationDeadlineAvailable: number;
  registrationDeadlineMissing: number;
  next35DayCount: number;
  targetActiveHackathons: number;
  targetReached: boolean;
  providerStatus: Record<string, IProviderStatus>;
  syncErrors: string[];
}

const providerStatusSchema = new Schema(
  {
    status: { type: String, enum: ['success', 'failed'], required: true },
    fetched: { type: Number, default: 0 },
    inserted: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
    error: { type: String },
  },
  { _id: false }
);

const syncAuditSchema = new Schema<ISyncAudit>(
  {
    syncStartedAt: { type: Date, required: true },
    syncCompletedAt: { type: Date, required: true },
    totalActiveHackathons: { type: Number, required: true },
    newRecords: { type: Number, required: true },
    updatedRecords: { type: Number, required: true },
    duplicatesPrevented: { type: Number, required: true },
    closedRecords: { type: Number, required: true },
    registrationDeadlineAvailable: { type: Number, required: true },
    registrationDeadlineMissing: { type: Number, required: true },
    next35DayCount: { type: Number, required: true },
    targetActiveHackathons: { type: Number, default: 400 },
    targetReached: { type: Boolean, required: true },
    providerStatus: { type: Map, of: providerStatusSchema, default: {} },
    syncErrors: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Index for fast retrieval of the latest sync status
syncAuditSchema.index({ syncCompletedAt: -1 });

export const SyncAudit = model<ISyncAudit>('SyncAudit', syncAuditSchema);
