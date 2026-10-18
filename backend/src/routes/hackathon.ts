import { Router } from 'express';
import {
  createHackathonController,
  getHackathonController,
  updateHackathonController,
  deleteHackathonController,
  searchHackathonsController,
  syncHackathonsController,
  getHackathonStatsController,
  getLocationOptionsController,
  bookmarkHackathonController,
  unbookmarkHackathonController,
  listBookmarksController,
  getSyncStatusController,
} from '../controllers/hackathonController';
import { verifyAccessToken, authorizeRoles } from '../middleware/authMiddleware';
import { validateCreateHackathon, validateUpdateHackathon, validateSearchHackathon } from '../validation/hackathonValidation';
import multer from 'multer';
import path from 'path';

// Multer setup for banner uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.resolve('uploads/hackathon-banners'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const router = Router();

// Public routes
router.get('/', searchHackathonsController);
router.get('/stats', getHackathonStatsController);
router.get('/location-options', getLocationOptionsController);
router.get('/sync-status', getSyncStatusController);
router.get('/:id', getHackathonController);

// Admin-only routes
router.post('/admin/sync', verifyAccessToken, authorizeRoles('Admin'), syncHackathonsController);

// Protected routes (admin and student for CRUD)
router.post(
  '/',
  verifyAccessToken,
  authorizeRoles('Admin', 'Student'),
  upload.single('banner'),
  validateCreateHackathon,
  createHackathonController,
);
router.put(
  '/:id',
  verifyAccessToken,
  authorizeRoles('Admin', 'Student'),
  upload.single('banner'),
  validateUpdateHackathon,
  updateHackathonController,
);
router.delete('/:id', verifyAccessToken, authorizeRoles('Admin', 'Student'), deleteHackathonController);

// Bookmark routes (student role)
router.post('/:id/bookmark', verifyAccessToken, authorizeRoles('Student'), bookmarkHackathonController);
router.delete('/:id/bookmark', verifyAccessToken, authorizeRoles('Student'), unbookmarkHackathonController);
router.get('/bookmarks/me', verifyAccessToken, authorizeRoles('Student'), listBookmarksController);

export default router;
