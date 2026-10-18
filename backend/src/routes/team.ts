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
import { verifyAccessToken, authorizeRoles } from '../middleware/authMiddleware';
import { validateCreateTeam, validateUpdateTeam } from '../validation/teamValidation';
import multer from 'multer';
import path from 'path';

// Multer setup for team logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve('uploads/team-logos'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

const router = Router();

// Public routes
router.get('/', searchTeamsController);
router.get('/:id', getTeamController);

// Protected routes (Leader/Admin)
router.post(
  '/',
  verifyAccessToken,
  authorizeRoles('Leader', 'Admin', 'Student'),
  upload.single('logo'),
  validateCreateTeam,
  createTeamController
);

router.put(
  '/:id',
  verifyAccessToken,
  authorizeRoles('Leader', 'Admin', 'Student'),
  upload.single('logo'),
  validateUpdateTeam,
  updateTeamController
);

router.delete(
  '/:id',
  verifyAccessToken,
  authorizeRoles('Leader', 'Admin', 'Student'),
  deleteTeamController
);

router.patch(
  '/:id/archive',
  verifyAccessToken,
  authorizeRoles('Leader', 'Admin', 'Student'),
  archiveTeamController
);

router.patch(
  '/:id/reopen',
  verifyAccessToken,
  authorizeRoles('Leader', 'Admin', 'Student'),
  reopenTeamController
);

router.patch(
  '/:id/transfer-leadership',
  verifyAccessToken,
  authorizeRoles('Leader', 'Admin', 'Student'),
  transferLeadershipController
);

router.delete(
  '/:id/members/:memberId',
  verifyAccessToken,
  authorizeRoles('Leader', 'Admin', 'Student'),
  removeMemberController
);

router.get(
  '/:id/messages',
  verifyAccessToken,
  authorizeRoles('Leader', 'Admin', 'Student'),
  getTeamMessagesController
);

export default router;
