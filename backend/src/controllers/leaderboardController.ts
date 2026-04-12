import { Request, Response } from 'express';
import { CommunityLeader } from '../models/CommunityLeader';
import { AuthRequest } from '../middleware/auth';
import { generateCommunityLeaderboard, generateTopLeaders } from '../services/leaderboardService';


export const getTopLeaderboard = async (req: Request, res: Response) => {
  try {
    const matchId = (req.query.matchId as string) || '1';
    const limit = req.query.limit || '30';

    // Generate top leaders from predictions table (Uncapped for small user base)
    const leaderboard = await generateTopLeaders(matchId as string);

    res.json({
      leaderboard,
      source: 'predictions_table',
    });
  } catch (error) {
    console.error('Get top leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch top leaderboard' });
  }
};

export const getCommunityLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = (req.query.matchId as string) || '1';
    const limit = req.query.limit || '30';

    // Read from CommunityLeader table (populated after match finalization)
    const leaderboard = await CommunityLeader.find({})
      .sort({ totalPoints: -1 })
      .lean();

    res.json({
      leaderboard,
      source: 'community_leader_table',
    });
  } catch (error) {
    console.error('Get community leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch community leaderboard' });
  }
};

export const getCommunityLeaderboardByMatch = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = (req.query.matchId as string) || '1';
    const limit = req.query.limit || '30';

    // Read from CommunityLeader table (populated after match finalization)
    const leaderboard = await CommunityLeader.find({})
      .sort({ totalPoints: -1 })
      .lean();

    res.json({
      leaderboard,
      source: 'community_leader_table',
    });
  } catch (error) {
    console.error('Get community leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch community leaderboard' });
  }
};
