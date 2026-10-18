import { Router, Request, Response } from "express";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { verifyAccessToken, AuthRequest } from "../middleware/authMiddleware";
import { JWT_ACCESS_SECRET } from "../config/jwt";
import multer from 'multer';
import path from 'path';

dotenv.config();
const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve('uploads'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${unique}-${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Get current user profile
router.get("/me", verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id).select("-password -refreshTokens");
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
router.put("/me", verifyAccessToken, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      updates.avatarUrl = `/uploads/${req.file.filename}`;
    }
    
    // Parse JSON strings back to arrays if sent as form-data
    if (typeof updates.skills === 'string') updates.skills = JSON.parse(updates.skills);
    if (typeof updates.certificates === 'string') updates.certificates = JSON.parse(updates.certificates);
    if (typeof updates.projects === 'string') updates.projects = JSON.parse(updates.projects);

    const user = await User.findByIdAndUpdate(req.user?.id, updates, { new: true }).select("-password -refreshTokens");
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Toggle bookmark hackathon
router.post("/me/bookmarks/hackathons/:id", verifyAccessToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
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
    const user = await User.findById(req.user?.id);
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
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

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
    const user = await User.findById(req.user?.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    if (notificationSettings) user.notificationSettings = { ...user.notificationSettings, ...notificationSettings };
    
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
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

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
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

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
    const user = await User.findOne({ email });
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
