import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, TopLeader, DailyLeader, CommunityLeader, DailyCommunityLeader, Community } from '../models';
import {
  generateTopLeaderboard,
  generateDailyLeaderboard,
  generateCommunityLeaderboard,
  generateDailyCommunityLeaderboard,
  generateCommunityUserRanking,
} from '../services/leaderboardService';

export const getTopLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Generate fresh leaderboard from database
    const leaderboard = await generateTopLeaderboard(limitNum);

    res.json({
      leaderboard,
      source: 'database',
    });
  } catch (error) {
    console.error('Get top leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

export const getDailyLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30', date } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const today = date ? new Date(date as string) : new Date();
    today.setHours(0, 0, 0, 0);

    // Generate fresh leaderboard from database
    const leaderboard = await generateDailyLeaderboard(limitNum);

    res.json({
      leaderboard,
      source: 'database',
    });
  } catch (error) {
    console.error('Get daily leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch daily leaderboard' });
  }
};

export const getCommunityLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    // Generate fresh leaderboard from database
    const leaderboard = await generateCommunityLeaderboard(limitNum);

    res.json({
      leaderboard,
      source: 'database',
    });
  } catch (error) {
    console.error('Get community leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch community leaderboard' });
  }
};

export const getDailyCommunityLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30', date } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const targetDate = date ? new Date(date as string) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const leaderboard = await generateDailyCommunityLeaderboard(limitNum, targetDate);

    res.json({
      leaderboard,
      source: 'database',
    });
  } catch (error) {
    console.error('Get daily community leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch daily community leaderboard' });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const topRank = await TopLeader.findOne({ userId });
    const dailyRank = await DailyLeader.findOne({ userId });

    // Fetch community ranks
    const communityRanks: any[] = [];

    if (user.communityId1) {
      const overall = await CommunityLeader.findOne({ communityId: user.communityId1 });
      const daily = await DailyCommunityLeader.findOne({ communityId: user.communityId1 }).sort({ date: -1 });

      let communityName = overall?.communityName;
      if (!communityName) {
        const community = await Community.findOne({ communityId: user.communityId1 });
        communityName = community?.name || 'Unknown';
      }

      communityRanks.push({
        communityId: user.communityId1,
        name: communityName,
        overall: overall || { rank: '-', totalPoints: 0 },
        daily: daily || { rank: '-', totalPoints: 0 },
      });
    }

    if (user.communityId2) {
      const overall = await CommunityLeader.findOne({ communityId: user.communityId2 });
      const daily = await DailyCommunityLeader.findOne({ communityId: user.communityId2 }).sort({ date: -1 });

      let communityName = overall?.communityName;
      if (!communityName) {
        const community = await Community.findOne({ communityId: user.communityId2 });
        communityName = community?.name || 'Unknown';
      }

      communityRanks.push({
        communityId: user.communityId2,
        name: communityName,
        overall: overall || { rank: '-', totalPoints: 0 },
        daily: daily || { rank: '-', totalPoints: 0 },
      });
    }

    res.json({
      overall: topRank || { rank: '-', totalPoints: 0 },
      daily: dailyRank || { rank: '-', totalPoints: 0 },
      communities: communityRanks,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};

/**
 * Get detailed user rankings for a specific community or global
 * Supports overall and daily
 */
export const getCommunityUserRanking = async (req: AuthRequest, res: Response) => {
  try {
    const { communityId } = req.params;
    const { isDaily, limit = '50' } = req.query;
    
    const limitNum = parseInt(limit as string, 10);
    const dailyBool = isDaily === 'true';

    const ranking = await generateCommunityUserRanking(communityId, dailyBool, limitNum);

    res.json({
      ranking,
      communityId,
      isDaily: dailyBool
    });
  } catch (error) {
    console.error('Get community user ranking error:', error);
    res.status(500).json({ error: 'Failed to fetch community user ranking' });
  }
};
