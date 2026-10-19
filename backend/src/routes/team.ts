import { Router } from 'express';
import {
  createTeamController,
  getTeamController,
  updateTeamController,
  deleteTeamController,
  archiveTeamController,
  reopenTeamController,
  transferLeadershipController,
  removeMemberController,
  searchTeamsController,
  getTeamMessagesController,
} from '../controllers/teamController';
import { verifyAccessToken, authorizeRoles, requireActiveUser } from '../middleware/authMiddleware';
import { validateCreateTeam, validateUpdateTeam } from '../validation/teamValidation';
import { validateExpress } from '../middleware/validationMiddleware';
import { isValidImageFile } from '../utils/imageValidator';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

const LOGO_UPLOAD_DIR = path.resolve('uploads/team-logos');
if (!fs.existsSync(LOGO_UPLOAD_DIR)) {
  fs.mkdirSync(LOGO_UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

const MIME_EXTENSION_MAP: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};

// Multer setup for team logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, LOGO_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.png';
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `logo-${unique}${safeExt}`);
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

const uploadLogoMiddleware = (req: Request, res: Response, next: NextFunction) => {
  upload.single('logo')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    if (req.file) {
      if (!isValidImageFile(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (_) {}
        return res.status(400).json({ error: 'Invalid file signature: uploaded file is not a valid image' });
      }
    }
    next();
  });
};

const router = Router();

// Public routes
router.get('/', searchTeamsController);
router.get('/:id', getTeamController);

// Protected routes (Leader/Admin)
router.post(
  '/',
  verifyAccessToken,
  requireActiveUser,
  authorizeRoles('Leader', 'Admin', 'Student'),
  uploadLogoMiddleware,
  validateExpress(validateCreateTeam),
  createTeamController
);

router.put(
  '/:id',
  verifyAccessToken,
  requireActiveUser,
  authorizeRoles('Leader', 'Admin', 'Student'),
  uploadLogoMiddleware,
  validateExpress(validateUpdateTeam),
  updateTeamController
);

router.delete(
  '/:id',
  verifyAccessToken,
  requireActiveUser,
  authorizeRoles('Leader', 'Admin', 'Student'),
  deleteTeamController
);

router.patch(
  '/:id/archive',
  verifyAccessToken,
  requireActiveUser,
  authorizeRoles('Leader', 'Admin', 'Student'),
  archiveTeamController
);

router.patch(
  '/:id/reopen',
  verifyAccessToken,
  requireActiveUser,
  authorizeRoles('Leader', 'Admin', 'Student'),
  reopenTeamController
);

router.patch(
  '/:id/transfer-leadership',
  verifyAccessToken,
  requireActiveUser,
  authorizeRoles('Leader', 'Admin', 'Student'),
  transferLeadershipController
);

router.delete(
  '/:id/members/:memberId',
  verifyAccessToken,
  requireActiveUser,
  authorizeRoles('Leader', 'Admin', 'Student'),
  removeMemberController
);

router.get(
  '/:id/messages',
  verifyAccessToken,
  requireActiveUser,
  authorizeRoles('Leader', 'Admin', 'Student'),
  getTeamMessagesController
);

export default router;
