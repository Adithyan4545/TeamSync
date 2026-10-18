import { Router } from 'express';
import {
  bookmarkHackathonController,
  unbookmarkHackathonController,
  bookmarkTeamController,
  unbookmarkTeamController,
  listBookmarksController,
} from '../controllers/bookmarkController';
import { verifyAccessToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', verifyAccessToken, listBookmarksController);
router.post('/', verifyAccessToken, bookmarkHackathonController);
router.post('/hackathons/:id', verifyAccessToken, bookmarkHackathonController);
router.delete('/hackathons/:id', verifyAccessToken, unbookmarkHackathonController);
router.delete('/:id', verifyAccessToken, unbookmarkHackathonController);
router.post('/teams/:id', verifyAccessToken, bookmarkTeamController);
router.delete('/teams/:id', verifyAccessToken, unbookmarkTeamController);

export default router;
