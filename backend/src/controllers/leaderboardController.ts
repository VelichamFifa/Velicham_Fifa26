import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TopLeader, DailyLeader, CommunityLeader } from '../models';
import {
  generateTopLeaderboard,
  generateDailyLeaderboard,
  generateCommunityLeaderboard,
  generateDailyCommunityLeaderboard,
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

    const topRank = await TopLeader.findOne({ userId });
    const dailyRank = await DailyLeader.findOne({ userId });

    res.json({
      overall: topRank || { rank: 'N/A', totalPoints: 0 },
      daily: dailyRank || { rank: 'N/A', totalPoints: 0 },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};
