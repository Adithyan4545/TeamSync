import { Router } from 'express';
import {
  sendJoinRequestController,
  cancelJoinRequestController,
  withdrawJoinRequestController,
  editJoinRequestMessageController,
  updateJoinRequestStatusController,
  bulkUpdateJoinRequestStatusController,
  getLeaderTeamRequestsController,
  getUserJoinRequestsController,
} from '../controllers/joinRequestController';
import { verifyAccessToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

// Student endpoints
router.post('/', verifyAccessToken, authorizeRoles('Student'), sendJoinRequestController);
router.delete('/:teamId', verifyAccessToken, authorizeRoles('Student'), cancelJoinRequestController);
router.patch('/:teamId/withdraw', verifyAccessToken, authorizeRoles('Student'), withdrawJoinRequestController);
router.patch('/:teamId/message', verifyAccessToken, authorizeRoles('Student'), editJoinRequestMessageController);
router.get('/my-requests', verifyAccessToken, authorizeRoles('Student'), getUserJoinRequestsController);

// Leader endpoints (Note: Students can also be team leaders)
router.get('/leader-requests', verifyAccessToken, authorizeRoles('Leader', 'Admin', 'Student'), getLeaderTeamRequestsController);
router.patch('/:requestId/status', verifyAccessToken, authorizeRoles('Leader', 'Admin', 'Student'), updateJoinRequestStatusController);
router.post('/bulk-status', verifyAccessToken, authorizeRoles('Leader', 'Admin', 'Student'), bulkUpdateJoinRequestStatusController);

export default router;
