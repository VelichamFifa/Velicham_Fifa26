import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as leaderboardController from '../controllers/leaderboardController';

const router = Router();

router.get('/top', leaderboardController.getTopLeaderboard);
router.get('/daily', leaderboardController.getDailyLeaderboard);
router.get('/group-stage', leaderboardController.getGroupStageLeaderboard);
router.get('/gr1', leaderboardController.getGR1Leaderboard);
router.get('/gr2', leaderboardController.getGR2Leaderboard);
router.get('/gr3', leaderboardController.getGR3Leaderboard);
router.get('/round-32', leaderboardController.getRound32Leaderboard);
router.get('/knockout', leaderboardController.getKnockoutLeaderboard);
router.get('/community', leaderboardController.getCommunityLeaderboard);
router.get('/community/daily', leaderboardController.getDailyCommunityLeaderboard);
router.get('/ranking/community/:communityId', leaderboardController.getCommunityUserRanking);
router.get('/community/:communityId/members', leaderboardController.getCommunityMembers);
router.get('/stats', authMiddleware, leaderboardController.getUserStats);
router.get('/winners', leaderboardController.getWinners);
router.get('/winners/photo/:photoId', leaderboardController.getWinnerPhoto);

export default router;
