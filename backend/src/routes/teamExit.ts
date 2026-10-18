import { Router } from 'express';
import {
  createExitRequestController,
  cancelExitRequestController,
  approveExitRequestController,
  rejectExitRequestController,
  getTeamExitRequestsController,
  getUserExitRequestsController,
} from '../controllers/teamExitController';
import { verifyAccessToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication
router.use(verifyAccessToken);

// Create exit request
router.post('/', createExitRequestController);

// Get current user's exit requests
router.get('/my', getUserExitRequestsController);

// Get team exit requests (leader or member)
router.get('/team/:teamId', getTeamExitRequestsController);

// Leader approves exit request
router.patch('/:requestId/approve', approveExitRequestController);

// Leader rejects exit request
router.patch('/:requestId/reject', rejectExitRequestController);

// Member cancels exit request
router.delete('/:requestId', cancelExitRequestController);

export default router;
