import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';

export const getTopLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const leaderboard = await prisma.topLeader.findMany({
      distinct: ['userId'],
      orderBy: { rank: 'asc' },
      take: limitNum,
    });

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    console.error('Get top leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

export const getDailyLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30', date } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const target = date ? new Date(date as string) : new Date();
    target.setHours(0, 0, 0, 0);

    const leaderboard = await prisma.dailyLeader.findMany({
      where: { date: target },
      distinct: ['userId'],
      orderBy: { rank: 'asc' },
      take: limitNum,
    });

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    console.error('Get daily leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch daily leaderboard' });
  }
};

export const getCommunityLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const leaderboard = await prisma.communityLeader.findMany({
      distinct: ['communityId'],
      orderBy: { rank: 'asc' },
      take: limitNum,
    });

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    console.error('Get community leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch community leaderboard' });
  }
};

export const getDailyCommunityLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30', date } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const target = date ? new Date(date as string) : new Date();
    target.setHours(0, 0, 0, 0);

    const leaderboard = await prisma.dailyCommunityLeader.findMany({
      where: { date: target },
      distinct: ['communityId'],
      orderBy: { rank: 'asc' },
      take: limitNum,
    });

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    console.error('Get daily community leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch daily community leaderboard' });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [topRank, dailyRankLatest] = await Promise.all([
      prisma.topLeader.findFirst({ where: { userId } }),
      prisma.dailyLeader.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
    ]);

    const communityRanks: any[] = [];
    for (const cid of [user.communityId1, user.communityId2].filter(Boolean) as string[]) {
      const [community, overall, daily] = await Promise.all([
        prisma.community.findUnique({ where: { communityId: cid }, select: { name: true } }),
        prisma.communityLeader.findFirst({ where: { communityId: cid } }),
        prisma.dailyCommunityLeader.findFirst({ where: { communityId: cid }, orderBy: { date: 'desc' } }),
      ]);
      communityRanks.push({
        communityId: cid,
        name: community?.name ?? cid,
        overall: overall || { rank: '-', totalPoints: 0 },
        daily: daily || { rank: '-', totalPoints: 0 },
      });
    }

    res.json({
      overall: topRank || { rank: '-', totalPoints: 0 },
      daily: dailyRankLatest || { rank: '-', totalPoints: 0 },
      communities: communityRanks,
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
};

export const getCommunityUserRanking = async (req: AuthRequest, res: Response) => {
  try {
    const { communityId } = req.params;
    const { isDaily, limit = '50' } = req.query;

    const limitNum = parseInt(limit as string, 10);
    const dailyBool = isDaily === 'true';

    const users = await prisma.user.findMany({
      where: { OR: [{ communityId1: communityId }, { communityId2: communityId }] },
      select: { userId: true, email: true, firstName: true, lastName: true, state: true, communityId1: true, communityId2: true },
      take: limitNum,
    });

    const userIds = users.map((u) => u.userId);
    if (userIds.length === 0) {
      return res.json({ ranking: [], communityId, isDaily: dailyBool });
    }

    if (dailyBool) {
      const leaders = await prisma.dailyLeader.findMany({
        where: { userId: { in: userIds } },
        orderBy: [{ date: 'desc' }, { rank: 'asc' }],
        take: limitNum,
      });
      return res.json({ ranking: leaders, communityId, isDaily: true });
    }

    const leaders = await prisma.topLeader.findMany({
      where: { userId: { in: userIds } },
      orderBy: { rank: 'asc' },
      take: limitNum,
    });

    return res.json({ ranking: leaders, communityId, isDaily: false });
  } catch (error) {
    console.error('Get community user ranking error:', error);
    res.status(500).json({ error: 'Failed to fetch community user ranking' });
  }
};

