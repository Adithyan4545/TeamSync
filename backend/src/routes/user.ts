import { Router, Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { verifyAccessToken, AuthRequest } from "../middleware/authMiddleware";
import { JWT_ACCESS_SECRET } from "../config/jwt";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();
const router = Router();

const UPLOAD_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const MIME_EXTENSION_MAP: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.png';
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${unique}${safeExt}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error('Invalid file type: Only JPEG, PNG, WEBP, and GIF images are allowed'));
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error('Invalid file extension: Only .jpg, .jpeg, .png, .webp, and .gif are allowed'));
  }
  const expectedExts = MIME_EXTENSION_MAP[file.mimetype];
  if (!expectedExts || !expectedExts.includes(ext)) {
    return cb(new Error('File extension does not match MIME type'));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export { isValidImageFile } from '../utils/imageValidator';
import { isValidImageFile } from '../utils/imageValidator';

const uploadAvatarMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('avatar')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }
    if (req.file) {
      if (!isValidImageFile(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (_) {}
        return res.status(400).json({ success: false, message: 'Invalid file signature: uploaded file is not a valid image' });
      }
    }
    next();
  });
};

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

// Get current user profile
router.get("/me", verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ _id: req.user?.id, isDeleted: { $ne: true } }).select("-password -refreshTokens");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get all users (for AI Match / Suggest Members)
router.get("/", verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    // Only return students or leaders that are active
    const users = await User.find({ isDeleted: { $ne: true } }).select("-password -refreshTokens");
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update current user profile
router.put("/me", verifyAccessToken, uploadAvatarMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existingUser = await User.findById(req.user?.id);
    if (!existingUser || existingUser.isDeleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const allowedFields = [
      'name', 'college', 'department', 'year', 'bio', 'avatarUrl',
      'skills', 'github', 'linkedin', 'portfolio', 'resumeUrl',
      'certificates', 'projects', 'availability',
    ];

    const stringFields = [
      'name', 'college', 'department', 'bio', 'avatarUrl',
      'github', 'linkedin', 'portfolio', 'resumeUrl', 'availability',
    ];

    const arrayFields = ['skills', 'certificates', 'projects'];

    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (req.file) {
      updates.avatarUrl = `/uploads/${req.file.filename}`;
    }

    // Validate string fields
    for (const field of stringFields) {
      if (updates[field] !== undefined && updates[field] !== null) {
        if (typeof updates[field] !== 'string') {
          return res.status(400).json({ success: false, message: `Field '${field}' must be a string` });
        }
      }
    }

    // Validate year
    if (updates.year !== undefined && updates.year !== null) {
      const numYear = Number(updates.year);
      if (isNaN(numYear) || !Number.isInteger(numYear) || numYear < 1 || numYear > 10) {
        return res.status(400).json({ success: false, message: "Field 'year' must be a valid integer between 1 and 10" });
      }
      updates.year = numYear;
    }

    // Parse and validate JSON array fields
    for (const field of arrayFields) {
      if (updates[field] !== undefined && updates[field] !== null) {
        let arr = updates[field];
        if (typeof arr === 'string') {
          try {
            arr = JSON.parse(arr);
          } catch (e) {
            return res.status(400).json({ success: false, message: `Field '${field}' must be a valid JSON array` });
          }
        }
        if (!Array.isArray(arr)) {
          return res.status(400).json({ success: false, message: `Field '${field}' must be an array` });
        }
        if (!arr.every((item: any) => typeof item === 'string')) {
          return res.status(400).json({ success: false, message: `All items in '${field}' must be strings` });
        }
        updates[field] = arr;
      }
    }

    const user = await User.findByIdAndUpdate(req.user?.id, updates, { new: true }).select("-password -refreshTokens");
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Toggle bookmark hackathon
router.post("/me/bookmarks/hackathons/:id", verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ _id: req.user?.id, isDeleted: { $ne: true } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    const hId = req.params.id;
    const isBookmarked = user.bookmarkedHackathons?.includes(hId);
    
    if (isBookmarked) {
      user.bookmarkedHackathons = user.bookmarkedHackathons?.filter(id => id !== hId);
    } else {
      user.bookmarkedHackathons = [...(user.bookmarkedHackathons || []), hId];
    }
    await user.save();
    res.json({ success: true, data: user.bookmarkedHackathons });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Toggle bookmark team
router.post("/me/bookmarks/teams/:id", verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findOne({ _id: req.user?.id, isDeleted: { $ne: true } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    
    const tId = req.params.id;
    const isBookmarked = user.bookmarkedTeams?.includes(tId);
    
    if (isBookmarked) {
      user.bookmarkedTeams = user.bookmarkedTeams?.filter(id => id !== tId);
    } else {
      user.bookmarkedTeams = [...(user.bookmarkedTeams || []), tId];
    }
    await user.save();
    res.json({ success: true, data: user.bookmarkedTeams });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Change Password
router.put("/me/password", verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ success: false, message: "Current password is required" });
    }
    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ success: false, message: "New password is required" });
    }
    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      });
    }

    const user = await User.findById(req.user?.id);
    if (!user || user.isDeleted) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.password) return res.status(400).json({ success: false, message: "Accounts created with Google do not have a password set" });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Incorrect current password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update Preferences & Notifications
router.put("/me/preferences", verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    const { preferences, notificationSettings } = req.body;
    if (preferences === undefined && notificationSettings === undefined) {
      return res.status(400).json({ success: false, message: "No preferences or notification settings provided" });
    }

    const user = await User.findById(req.user?.id);
    if (!user || user.isDeleted) return res.status(404).json({ success: false, message: "User not found" });

    const ALLOWED_PREFERENCES = ['theme', 'language', 'timezone', 'defaultDashboard'];
    const ALLOWED_NOTIFICATION_SETTINGS = ['emailNotifications', 'pushNotifications', 'assignmentAlerts', 'teamRequestAlerts'];

    if (preferences !== undefined) {
      if (typeof preferences !== 'object' || preferences === null || Array.isArray(preferences)) {
        return res.status(400).json({ success: false, message: "Preferences must be an object" });
      }
      user.preferences = user.preferences || {};
      for (const key of Object.keys(preferences)) {
        if (!ALLOWED_PREFERENCES.includes(key)) {
          return res.status(400).json({ success: false, message: `Invalid preference setting: ${key}` });
        }
        if (typeof preferences[key] !== 'string') {
          return res.status(400).json({ success: false, message: `Preference '${key}' must be a string` });
        }
        (user.preferences as any)[key] = preferences[key];
      }
    }

    if (notificationSettings !== undefined) {
      if (typeof notificationSettings !== 'object' || notificationSettings === null || Array.isArray(notificationSettings)) {
        return res.status(400).json({ success: false, message: "Notification settings must be an object" });
      }
      user.notificationSettings = user.notificationSettings || {};
      for (const key of Object.keys(notificationSettings)) {
        if (!ALLOWED_NOTIFICATION_SETTINGS.includes(key)) {
          return res.status(400).json({ success: false, message: `Invalid notification setting: ${key}` });
        }
        if (typeof notificationSettings[key] !== 'boolean') {
          return res.status(400).json({ success: false, message: `Notification setting '${key}' must be a boolean` });
        }
        (user.notificationSettings as any)[key] = notificationSettings[key];
      }
    }
    
    await user.save();
    res.json({ success: true, data: { preferences: user.preferences, notificationSettings: user.notificationSettings } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete Account
router.delete("/me", verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || user.isDeleted) return res.status(404).json({ success: false, message: "User not found" });

    // Soft delete or hard delete. For complete implementation, hard delete or mark isDeleted.
    user.isDeleted = true;
    user.refreshTokens = []; // Log out from all devices
    await user.save();

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Logout All Devices
router.post("/logout-all", verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user || user.isDeleted) return res.status(404).json({ success: false, message: "User not found" });

    user.refreshTokens = [];
    await user.save();

    res.json({ success: true, message: "Logged out from all devices" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Register (Legacy)
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, JWT_ACCESS_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name, email } });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Login (Legacy)
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, isDeleted: { $ne: true } });
    if (!user || !user.password) return res.status(400).json({ msg: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });
    const token = jwt.sign({ id: user._id }, JWT_ACCESS_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email } });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

export default router;
