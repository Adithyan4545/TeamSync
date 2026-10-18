import { Router } from 'express';
import {
  createAssignmentController,
  getAssignmentsByTeamController,
  updateAssignmentController,
  deleteAssignmentController,
  submitAssignmentController,
  evaluateSubmissionController,
  reopenSubmissionController,
  getSubmissionsForAssignmentController,
} from '../controllers/assignmentController';
import { verifyAccessToken, authorizeRoles } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve('uploads/assignments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 25 * 1024 * 1024 } }); // 25MB limit

const router = Router();

router.get('/team/:teamId', verifyAccessToken, getAssignmentsByTeamController);
router.post('/', verifyAccessToken, authorizeRoles('Leader', 'Admin', 'Student'), createAssignmentController);
router.put('/:id', verifyAccessToken, authorizeRoles('Leader', 'Admin', 'Student'), updateAssignmentController);
router.delete('/:id', verifyAccessToken, authorizeRoles('Leader', 'Admin', 'Student'), deleteAssignmentController);

router.post('/:id/submit', verifyAccessToken, authorizeRoles('Student', 'Leader', 'Admin'), upload.single('file'), submitAssignmentController);
router.get('/:id/submissions', verifyAccessToken, authorizeRoles('Leader', 'Admin', 'Student'), getSubmissionsForAssignmentController);
router.patch('/submissions/:submissionId/evaluate', verifyAccessToken, authorizeRoles('Leader', 'Admin', 'Student'), evaluateSubmissionController);
router.patch('/submissions/:submissionId/reopen', verifyAccessToken, authorizeRoles('Leader', 'Admin', 'Student'), reopenSubmissionController);

export default router;
