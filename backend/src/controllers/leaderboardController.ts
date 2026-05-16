import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

/** Rows must already be ordered best-first (e.g. rank asc, points desc). Keeps first row per key. */
function distinctByKey<T>(rows: T[], keyOf: (row: T) => string, limit: number): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = keyOf(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
    if (out.length >= limit) break;
  }
  return out;
}

/** Oversample then dedupe — fixes duplicate userId/communityId rows in materialized tables. */
const LEADERBOARD_OVERFETCH_CAP = 2500;

function getDayRange(date: Date): { startOfDay: Date; endOfDay: Date } {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);
  return { startOfDay, endOfDay };
}

export const getTopLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const take = Math.min(LEADERBOARD_OVERFETCH_CAP, Math.max(limitNum * 80, limitNum));
    const rows = await prisma.topLeader.findMany({
      orderBy: [{ rank: 'asc' }, { totalPoints: 'desc' }, { id: 'desc' }],
      take,
    });
    const leaderboard = distinctByKey(rows, (r) => r.userId, limitNum);

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    const errorDetails = logger.error('getTopLeaderboard', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch leaderboard' });
  }
};

export const getDailyLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30' } = req.query;
    const parsedLimit = parseInt(limit as string, 10);
    const limitNum = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 30;

    const take = Math.min(LEADERBOARD_OVERFETCH_CAP, Math.max(limitNum * 80, limitNum));
    const rows = await prisma.dailyLeader.findMany({
      orderBy: [{ rank: 'asc' }, { totalPoints: 'desc' }, { id: 'desc' }],
      take,
    });
    const leaderboard = distinctByKey(rows, (r) => r.userId, limitNum);

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    const errorDetails = logger.error('getDailyLeaderboard', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch daily leaderboard' });
  }
};

export const getCommunityLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const take = Math.min(LEADERBOARD_OVERFETCH_CAP, Math.max(limitNum * 80, limitNum));
    const rows = await prisma.communityLeader.findMany({
      orderBy: [{ rank: 'asc' }, { totalPoints: 'desc' }, { id: 'desc' }],
      take,
    });
    const leaderboard = distinctByKey(rows, (r) => r.communityId, limitNum);

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    const errorDetails = logger.error('getCommunityLeaderboard', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch community leaderboard' });
  }
};

export const getDailyCommunityLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '30' } = req.query;
    const parsedLimit = parseInt(limit as string, 10);
    const limitNum = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 30;

    const latestDaily = await prisma.dailyCommunityLeader.findFirst({
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      select: { date: true },
    });

    if (!latestDaily) {
      return res.json({ leaderboard: [], source: 'database' });
    }

    const { startOfDay, endOfDay } = getDayRange(latestDaily.date);

    const take = Math.min(LEADERBOARD_OVERFETCH_CAP, Math.max(limitNum * 80, limitNum));
    const rows = await prisma.dailyCommunityLeader.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      orderBy: [{ rank: 'asc' }, { totalPoints: 'desc' }, { id: 'desc' }],
      take,
    });
    const leaderboard = distinctByKey(rows, (r) => r.communityId, limitNum);

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    const errorDetails = logger.error('getDailyCommunityLeaderboard', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch daily community leaderboard' });
  }
};

export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });

    const userIdNum = Number(userId);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: userIdNum } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const finalUserResult = await prisma.finalUserResult.findUnique({ where: { userId: userIdNum } });

    const finalStats = finalUserResult
      ? { rank: finalUserResult.finalRank ?? '-', totalPoints: finalUserResult.finalPoint }
      : { rank: '-', totalPoints: 0 };

    const communityRanks: any[] = [];
    for (const cid of [user.communityId1, user.communityId2].filter((v): v is number => typeof v === 'number')) {
      const cidStr = String(cid);
      const [community, latestCommunityResult] = await Promise.all([
        Number.isInteger(cid) && cid > 0
          ? prisma.community.findUnique({ where: { id: cid }, select: { name: true } })
          : Promise.resolve(null),
        prisma.communityResult.findFirst({
          where: { communityId: cidStr },
          orderBy: [{ matchId: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
        }),
      ]);

      communityRanks.push({
        communityId: cidStr,
        name: community?.name ?? cidStr,
        overall: latestCommunityResult
          ? {
              rank: latestCommunityResult.finalRank ?? '-',
              totalPoints: latestCommunityResult.totalCommunityPoint,
            }
          : { rank: '-', totalPoints: 0 },
        daily: latestCommunityResult
          ? {
              rank: latestCommunityResult.dailyRank ?? '-',
              totalPoints: latestCommunityResult.communityMatchPoint,
            }
          : { rank: '-', totalPoints: 0 },
      });
    }

    res.json({
      overall: finalStats,
      final: finalStats,
      communities: communityRanks,
    });
  } catch (error) {
    const errorDetails = logger.error('getUserStats', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch user stats' });
  }
};

export const getCommunityUserRanking = async (req: AuthRequest, res: Response) => {
  try {
    const { communityId } = req.params;
    const { isDaily, limit = '50' } = req.query;

    const limitNum = parseInt(limit as string, 10);
    const dailyBool = isDaily === 'true';

    const communityIdNum = Number(communityId);
    if (!Number.isInteger(communityIdNum) || communityIdNum <= 0) {
      return res.status(400).json({ error: 'Invalid communityId' });
    }

    const users = await prisma.user.findMany({
      where: { OR: [{ communityId1: communityIdNum }, { communityId2: communityIdNum }] },
      select: { id: true, email: true, firstName: true, lastName: true, state: true, communityId1: true, communityId2: true },
      take: limitNum,
    });

    const userIds = users.map((u) => String(u.id));
    if (userIds.length === 0) {
      return res.json({ ranking: [], communityId, isDaily: dailyBool });
    }

    if (dailyBool) {
      const latestDaily = await prisma.dailyLeader.findFirst({
        where: { userId: { in: userIds } },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        select: { date: true },
      });

      if (!latestDaily) {
        return res.json({ ranking: [], communityId, isDaily: true });
      }

      const { startOfDay, endOfDay } = getDayRange(latestDaily.date);
      const take = Math.min(LEADERBOARD_OVERFETCH_CAP, Math.max(limitNum * 80, limitNum));
      const leadersRaw = await prisma.dailyLeader.findMany({
        where: {
          userId: { in: userIds },
          date: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
        orderBy: [{ rank: 'asc' }, { totalPoints: 'desc' }, { id: 'desc' }],
        take,
      });
      const ranking = distinctByKey(leadersRaw, (r) => r.userId, limitNum);
      return res.json({ ranking, communityId, isDaily: true });
    }

    const take = Math.min(LEADERBOARD_OVERFETCH_CAP, Math.max(limitNum * 80, limitNum));
    const leadersRaw = await prisma.topLeader.findMany({
      where: { userId: { in: userIds } },
      orderBy: [{ rank: 'asc' }, { totalPoints: 'desc' }, { id: 'desc' }],
      take,
    });
    const ranking = distinctByKey(leadersRaw, (r) => r.userId, limitNum);

    return res.json({ ranking, communityId, isDaily: false });
  } catch (error) {
    const errorDetails = logger.error('getCommunityUserRanking', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      communityId: req.params.communityId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch community user ranking' });
  }
};

