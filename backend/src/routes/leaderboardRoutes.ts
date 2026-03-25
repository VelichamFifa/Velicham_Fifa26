import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as leaderboardController from '../controllers/leaderboardController';

const router = Router();

router.get('/top', leaderboardController.getTopLeaderboard);
router.get('/daily', leaderboardController.getDailyLeaderboard);
router.get('/community', leaderboardController.getCommunityLeaderboard);
router.get('/community/daily', leaderboardController.getDailyCommunityLeaderboard);
router.get('/ranking/community/:communityId', leaderboardController.getCommunityUserRanking);
router.get('/stats', authMiddleware, leaderboardController.getUserStats);

export default router;
