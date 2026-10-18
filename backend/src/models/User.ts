import { Schema, model, Document } from "mongoose";

export enum UserRole {
  STUDENT = "student",
  LEADER = "leader",
  ADMIN = "admin",
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // hashed (optional for Google users)
  googleId?: string;
  role: UserRole;
  college?: string;
  department?: string;
  year?: number;
  bio?: string;
  avatarUrl?: string;
  skills?: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
  resumeUrl?: string;
  certificates?: string[];
  projects?: string[];
  availability?: string;
  bookmarkedHackathons?: string[];
  bookmarkedTeams?: string[];
  isDeleted?: boolean;
  isVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  refreshTokens?: { token: string; expires: Date }[];
  preferences?: {
    theme?: string;
    language?: string;
    timezone?: string;
    defaultDashboard?: string;
  };
  notificationSettings?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    assignmentAlerts?: boolean;
    teamRequestAlerts?: boolean;
  };
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { 
      type: String, 
      required: function(this: any) { 
        return !this.googleId; 
      } 
    },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.STUDENT },
    college: String,
    department: String,
    year: Number,
    bio: String,
    avatarUrl: String,
    skills: [String],
    github: String,
    linkedin: String,
    portfolio: String,
    resumeUrl: String,
    certificates: [String],
    projects: [String],
    availability: String,
    bookmarkedHackathons: [String],
    bookmarkedTeams: [String],
    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    refreshTokens: [{ token: { type: String }, expires: { type: Date } }],
    preferences: {
      theme: { type: String, default: 'system' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'UTC' },
      defaultDashboard: { type: String, default: 'overview' }
    },
    notificationSettings: {
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      assignmentAlerts: { type: Boolean, default: true },
      teamRequestAlerts: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);

