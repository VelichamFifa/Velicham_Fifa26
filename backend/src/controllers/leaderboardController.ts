import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { BlobServiceClient } from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';

const WINNER_PHOTO_CONTAINER = 'winner-photos';

function getBlobServiceClient(): BlobServiceClient {
  const accountUrl = process.env.AZURE_BLOB_STORAGE_ACCOUNT_URL;
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (accountUrl) {
    return new BlobServiceClient(accountUrl, new DefaultAzureCredential());
  }
  if (connectionString) {
    return BlobServiceClient.fromConnectionString(connectionString);
  }
  throw new Error('Azure Storage configuration (URL or Connection String) is missing');
}

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
    const { limit = '500' } = req.query;
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
    const { limit = '500' } = req.query;
    const parsedLimit = parseInt(limit as string, 10);
    const limitNum = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 500;

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

export const getGroupStageLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const results = await prisma.$queryRaw<
      Array<{
        totalPoints: bigint;
        name: string;
        state: string;
        community1: string | null;
        community2: string | null;
        userId: string;
      }>
    >`
      SELECT
        (COALESCE(fur.GR1, 0) + COALESCE(fur.GR2, 0) + COALESCE(fur.GR3, 0)) AS totalPoints,
        TRIM(CONCAT(u.firstName, ' ', u.lastName)) AS name,
        UPPER(COALESCE(u.state, '')) AS state,
        c1.name AS community1,
        c2.name AS community2,
        CAST(u.id AS CHAR) AS userId
      FROM final_user_results fur
      INNER JOIN users u ON u.id = fur.userId
      LEFT JOIN communities c1 ON c1.id = u.communityId1
      LEFT JOIN communities c2 ON c2.id = u.communityId2
      WHERE (COALESCE(fur.GR1, 0) + COALESCE(fur.GR2, 0) + COALESCE(fur.GR3, 0)) > 0
      ORDER BY totalPoints DESC, fur.finalPoint DESC, u.id ASC
    `;

    const leaderboard = results.map(r => ({
      ...r,
      totalPoints: Number(r.totalPoints),
    }));

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    if (error instanceof Error) {
      (error as any).stack = error.stack;
    }
    const errorDetails = logger.error('getGroupStageLeaderboard', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch group stage leaderboard' });
  }
};

export const getGR1Leaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const results = await prisma.$queryRaw<
      Array<{
        totalPoints: bigint;
        name: string;
        state: string;
        community1: string | null;
        community2: string | null;
        userId: string;
      }>
    >`
      SELECT
        COALESCE(fur.GR1, 0) AS totalPoints,
        TRIM(CONCAT(u.firstName, ' ', u.lastName)) AS name,
        UPPER(COALESCE(u.state, '')) AS state,
        c1.name AS community1,
        c2.name AS community2,
        CAST(u.id AS CHAR) AS userId
      FROM final_user_results fur
      INNER JOIN users u ON u.id = fur.userId
      LEFT JOIN communities c1 ON c1.id = u.communityId1
      LEFT JOIN communities c2 ON c2.id = u.communityId2
      WHERE COALESCE(fur.GR1, 0) > 0
      ORDER BY totalPoints DESC, fur.finalPoint DESC, u.id ASC
    `;

    const leaderboard = results.map(r => ({
      ...r,
      totalPoints: Number(r.totalPoints),
    }));

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    const errorDetails = logger.error('getGR1Leaderboard', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch GR1 leaderboard' });
  }
};

export const getGR2Leaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const results = await prisma.$queryRaw<
      Array<{
        totalPoints: bigint;
        name: string;
        state: string;
        community1: string | null;
        community2: string | null;
        userId: string;
      }>
    >`
      SELECT
        COALESCE(fur.GR2, 0) AS totalPoints,
        TRIM(CONCAT(u.firstName, ' ', u.lastName)) AS name,
        UPPER(COALESCE(u.state, '')) AS state,
        c1.name AS community1,
        c2.name AS community2,
        CAST(u.id AS CHAR) AS userId
      FROM final_user_results fur
      INNER JOIN users u ON u.id = fur.userId
      LEFT JOIN communities c1 ON c1.id = u.communityId1
      LEFT JOIN communities c2 ON c2.id = u.communityId2
      WHERE COALESCE(fur.GR2, 0) > 0
      ORDER BY totalPoints DESC, fur.finalPoint DESC, u.id ASC
    `;

    const leaderboard = results.map(r => ({
      ...r,
      totalPoints: Number(r.totalPoints),
    }));

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    const errorDetails = logger.error('getGR2Leaderboard', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch GR2 leaderboard' });
  }
};

export const getGR3Leaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const results = await prisma.$queryRaw<
      Array<{
        totalPoints: bigint;
        name: string;
        state: string;
        community1: string | null;
        community2: string | null;
        userId: string;
      }>
    >`
      SELECT
        COALESCE(fur.GR3, 0) AS totalPoints,
        TRIM(CONCAT(u.firstName, ' ', u.lastName)) AS name,
        UPPER(COALESCE(u.state, '')) AS state,
        c1.name AS community1,
        c2.name AS community2,
        CAST(u.id AS CHAR) AS userId
      FROM final_user_results fur
      INNER JOIN users u ON u.id = fur.userId
      LEFT JOIN communities c1 ON c1.id = u.communityId1
      LEFT JOIN communities c2 ON c2.id = u.communityId2
      WHERE COALESCE(fur.GR3, 0) > 0
      ORDER BY totalPoints DESC, fur.finalPoint DESC, u.id ASC
    `;

    const leaderboard = results.map(r => ({
      ...r,
      totalPoints: Number(r.totalPoints),
    }));

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    const errorDetails = logger.error('getGR3Leaderboard', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch GR3 leaderboard' });
  }
};

export const getRound32Leaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const results = await prisma.$queryRaw<
      Array<{
        totalPoints: bigint;
        name: string;
        state: string;
        community1: string | null;
        community2: string | null;
        userId: string;
      }>
    >`
      SELECT
        CASE
          WHEN COALESCE(fur.R32, 0) > 0 THEN COALESCE(fur.R32, 0)
          ELSE GREATEST(0, COALESCE(fur.finalPoint, 0) - (COALESCE(fur.GR1, 0) + COALESCE(fur.GR2, 0) + COALESCE(fur.GR3, 0)))
        END AS totalPoints,
        TRIM(CONCAT(u.firstName, ' ', u.lastName)) AS name,
        UPPER(COALESCE(u.state, '')) AS state,
        c1.name AS community1,
        c2.name AS community2,
        CAST(u.id AS CHAR) AS userId
      FROM final_user_results fur
      JOIN users u ON u.id = fur.userId
      LEFT JOIN communities c1 ON c1.id = u.communityId1
      LEFT JOIN communities c2 ON c2.id = u.communityId2
      WHERE
        (COALESCE(fur.R32, 0) > 0) OR
        (COALESCE(fur.finalPoint, 0) > (COALESCE(fur.GR1, 0) + COALESCE(fur.GR2, 0) + COALESCE(fur.GR3, 0)))
      ORDER BY totalPoints DESC, fur.finalPoint DESC, u.id ASC
    `;

    const leaderboard = results.map(r => ({
      ...r,
      totalPoints: Number(r.totalPoints),
    }));

    res.json({ leaderboard, source: 'database' });
  } catch (error) {
    const errorDetails = logger.error('getRound32Leaderboard', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch round 32 leaderboard' });
  }
};

export const getCommunityLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '100' } = req.query;
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
    const { limit = '100' } = req.query;
    const parsedLimit = parseInt(limit as string, 10);
    const limitNum = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 100;

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

    const userIdStr = String(userIdNum);

    const [topLeader, latestDailyLeader, latestResult] = await Promise.all([
      prisma.topLeader.findFirst({
        where: { userId: userIdStr },
        orderBy: [{ rank: 'asc' }],
        select: { rank: true, totalPoints: true },
      }),
      prisma.dailyLeader.findFirst({
        where: { userId: userIdStr },
        orderBy: [{ date: 'desc' }, { rank: 'asc' }],
        select: { rank: true, totalPoints: true },
      }),
      prisma.result.findFirst({
        where: { userId: userIdNum },
        orderBy: [{ createdAt: 'desc' }],
        select: { matchTag: true },
      }),
    ]);

    let finalStats: { rank: string | number; totalPoints: number };
    if (topLeader) {
      finalStats = { rank: topLeader.rank, totalPoints: topLeader.totalPoints };
      await prisma.finalUserResult.upsert({
        where: { userId: userIdNum },
        create: {
          userId: userIdNum,
          finalPoint: topLeader.totalPoints,
          finalRank: topLeader.rank,
        },
        update: {
          finalPoint: topLeader.totalPoints,
          finalRank: topLeader.rank,
        },
      });
    } else {
      const finalUserResult = await prisma.finalUserResult.findUnique({ where: { userId: userIdNum } });
      const pointsSum = await prisma.result.aggregate({
        where: { userId: userIdNum },
        _sum: { finalPoints: true },
      });
      finalStats = finalUserResult
        ? { rank: finalUserResult.finalRank ?? '-', totalPoints: finalUserResult.finalPoint }
        : { rank: '-', totalPoints: pointsSum._sum.finalPoints ?? 0 };
    }

    const lastMatchTag = latestResult?.matchTag ?? null;

    const dailyStats = latestDailyLeader
      ? { rank: latestDailyLeader.rank, totalPoints: latestDailyLeader.totalPoints, lastMatchTag }
      : { rank: '-', totalPoints: 0, lastMatchTag };

    const communityIds = [user.communityId1, user.communityId2].filter((v): v is number => typeof v === 'number');
    const communityRanks = await Promise.all(
      communityIds.map(async (cid) => {
        const cidStr = String(cid);
        const [community, communityLeader, dailyCommunityLeader] = await Promise.all([
          prisma.community.findUnique({ where: { id: cid }, select: { name: true } }),
          prisma.communityLeader.findFirst({
            where: { communityId: cidStr },
            orderBy: [{ rank: 'asc' }],
            select: { rank: true, totalPoints: true },
          }),
          prisma.dailyCommunityLeader.findFirst({
            where: { communityId: cidStr },
            orderBy: [{ date: 'desc' }, { rank: 'asc' }],
            select: { rank: true, totalPoints: true },
          }),
        ]);

        return {
          communityId: cidStr,
          name: community?.name ?? cidStr,
          overall: communityLeader
            ? { rank: communityLeader.rank, totalPoints: communityLeader.totalPoints }
            : { rank: '-', totalPoints: 0 },
          daily: dailyCommunityLeader
            ? { rank: dailyCommunityLeader.rank, totalPoints: dailyCommunityLeader.totalPoints }
            : { rank: '-', totalPoints: 0 },
        };
      })
    );

    res.json({
      overall: finalStats,
      daily: dailyStats,
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
    const { isDaily } = req.query;

    const dailyBool = isDaily === 'true';

    const communityIdNum = Number(communityId);
    if (!Number.isInteger(communityIdNum) || communityIdNum <= 0) {
      return res.status(400).json({ error: 'Invalid communityId' });
    }

    const users = await prisma.user.findMany({
      where: { OR: [{ communityId1: communityIdNum }, { communityId2: communityIdNum }] },
      select: { id: true, email: true, firstName: true, lastName: true, state: true, communityId1: true, communityId2: true },
    });

    const userIdsNum = users.map((u) => u.id);
    if (userIdsNum.length === 0) {
      return res.json({ ranking: [], communityId, isDaily: dailyBool });
    }

    const finalResults = await prisma.finalUserResult.findMany({
      where: { userId: { in: userIdsNum } },
    });

    const userMap = new Map(users.map(u => [u.id, u]));
    let ranking = finalResults.map(fr => {
      const u = userMap.get(fr.userId);
      return {
        userId: String(fr.userId),
        name: u ? `${u.firstName} ${u.lastName}`.trim() : '',
        totalPoints: fr.finalPoint || 0,
        rank: fr.finalRank || 0,
        state: u?.state || ''
      };
    });

    ranking.sort((a, b) => b.totalPoints - a.totalPoints);

    return res.json({ ranking, communityId, isDaily: dailyBool });
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

export const getWinners = async (req: AuthRequest, res: Response) => {
  try {
    const userWinners = await prisma.$queryRaw<
      Array<{
        id: number;
        userId: number;
        firstName: string;
        lastName: string;
        photoId: string | null;
        roundName: string;
        rank: number;
        city: string;
        state: string;
        country: string;
      }>
    >`
      SELECT
        uw.id,
        uw.userId,
        uw.firstName,
        uw.lastName,
        uw.photoId,
        uw.roundName,
        uw.\`rank\`,
        COALESCE(u.city, '') AS city,
        COALESCE(u.state, '') AS state,
        COALESCE(u.country, '') AS country
      FROM user_winners uw
      LEFT JOIN users u ON u.id = uw.userId
      ORDER BY uw.roundName ASC, uw.\`rank\` ASC
    `;

    const communityWinners = await prisma.$queryRaw<
      Array<{
        id: number;
        communityId: number;
        communityShortName: string;
        communityLongName: string | null;
        photoId: string | null;
        roundName: string;
        rank: number;
        city: string;
        state: string;
        country: string;
      }>
    >`
      SELECT
        cw.id,
        cw.communityId,
        cw.communityShortName,
        cw.communityLongName,
        cw.photoId,
        cw.roundName,
        cw.\`rank\`,
        COALESCE(c.city, '') AS city,
        COALESCE(c.state, '') AS state,
        '' AS country
      FROM community_winners cw
      LEFT JOIN communities c ON c.id = cw.communityId
      ORDER BY cw.roundName ASC, cw.\`rank\` ASC
    `;

    // Group by roundName
    const groupedUsers: Record<string, typeof userWinners> = {};
    for (const w of userWinners) {
      if (!groupedUsers[w.roundName]) groupedUsers[w.roundName] = [];
      groupedUsers[w.roundName].push(w);
    }

    const groupedCommunities: Record<string, typeof communityWinners> = {};
    for (const w of communityWinners) {
      if (!groupedCommunities[w.roundName]) groupedCommunities[w.roundName] = [];
      groupedCommunities[w.roundName].push(w);
    }

    // Keep `grouped` for backwards compatibility with current frontend contract.
    return res.json({ grouped: groupedUsers, groupedUsers, groupedCommunities });
  } catch (error) {
    const errorDetails = logger.error('getWinners', error, {
      method: req.method,
      path: req.path,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch winners' });
  }
};

export const getWinnerPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { photoId } = req.params;
    if (!photoId || photoId.trim() === '') {
      return res.status(400).json({ error: 'photoId is required' });
    }

    // Prevent path traversal
    const safeName = photoId.replace(/[^a-zA-Z0-9._-]/g, '');
    if (!safeName) {
      return res.status(400).json({ error: 'Invalid photoId' });
    }

    const blobServiceClient = getBlobServiceClient();
    const containerClient = blobServiceClient.getContainerClient(WINNER_PHOTO_CONTAINER);

    const hasExtension = safeName.includes('.');
    const candidates = hasExtension
      ? [safeName]
      : [safeName, `${safeName}.jpg`, `${safeName}.jpeg`, `${safeName}.png`, `${safeName}.webp`];

    let foundName: string | null = null;
    for (const candidate of candidates) {
      logger.info('getWinnerPhoto', 'Checking for winner photo', { candidate });
      const exists = await containerClient.getBlobClient(candidate).exists();
      if (exists) {
        foundName = candidate;
        break;
      }
    }

    if (!foundName) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const blobClient = containerClient.getBlobClient(foundName);
    const downloadResponse = await blobClient.download();
    const contentType = downloadResponse.contentType || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    downloadResponse.readableStreamBody!.pipe(res);
  } catch (error) {
    const errorDetails = logger.error('getWinnerPhoto', error, {
      method: req.method,
      path: req.path,
      photoId: req.params.photoId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch winner photo' });
  }
};

export const getCommunityMembers = async (req: AuthRequest, res: Response) => {
  try {
    const { communityId } = req.params;

    const communityIdNum = Number(communityId);
    if (!Number.isInteger(communityIdNum) || communityIdNum <= 0) {
      return res.status(400).json({ error: 'Invalid communityId' });
    }

    const users = await prisma.user.findMany({
      where: { OR: [{ communityId1: communityIdNum }, { communityId2: communityIdNum }] },
      select: { id: true, firstName: true, lastName: true },
    });

    const members = users.map(u => ({
        userId: String(u.id),
        name: `${u.firstName} ${u.lastName}`.trim(),
    }));

    members.sort((a, b) => a.name.localeCompare(b.name));

    return res.json({ members, communityId });
  } catch (error) {
    const errorDetails = logger.error('getCommunityMembers', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      communityId: req.params.communityId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch community members' });
  }
};

export const rebuildMatchLeaders = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId } = req.body;
    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required' });
    }

    const matchIdNum = Number(matchId);
    if (!Number.isInteger(matchIdNum) || matchIdNum <= 0) {
      return res.status(400).json({ error: 'Invalid matchId' });
    }

    await prisma.$executeRawUnsafe(`DELETE FROM mv_match_leaders`);

    const insertQuery = `
      INSERT INTO mv_match_leaders (
        \`rank\`, totalPoints, name, state, community1, community2, userId, email, \`date\`, createdAt, updatedAt
      )
      SELECT
        rk,
        matchPoints,
        name,
        COALESCE(state, ''),
        community1,
        community2,
        userId,
        COALESCE(email, ''),
        UTC_DATE(),
        UTC_TIMESTAMP(),
        UTC_TIMESTAMP()
      FROM (
        SELECT
          DENSE_RANK() OVER (ORDER BY matchPoints DESC) AS rk,
          matchPoints,
          name,
          state,
          community1,
          community2,
          userId,
          email
        FROM (
          SELECT
            CAST(u.id AS CHAR) AS userId,
            TRIM(CONCAT(u.firstName, ' ', u.lastName)) AS name,
            COALESCE(r.matchPoints, 0) AS matchPoints,
            UPPER(u.state) AS state,
            c1.name AS community1,
            c2.name AS community2,
            u.email AS email
          FROM results r
          INNER JOIN users u ON u.id = r.userId
          LEFT JOIN communities c1 ON c1.id = u.communityId1
          LEFT JOIN communities c2 ON c2.id = u.communityId2
          WHERE r.matchId = ${matchIdNum}
        ) match_totals
      ) ranked
      ORDER BY rk ASC
    `;

    await prisma.$executeRawUnsafe(insertQuery);

    // Per your request, update community_results for communityId=1
    const communityUpdateQuery = `
      UPDATE community_results
      SET
        communityMatchPoint = communityMatchPoint - communityWeightagePoint,
        totalCommunityPoint = totalCommunityPoint - communityWeightagePoint
      WHERE
        communityId = '1' AND matchId = ${matchIdNum}
    `;

    await prisma.$executeRawUnsafe(communityUpdateQuery);

    res.json({ message: 'mv_match_leaders rebuilt and community points adjusted successfully', matchId: matchIdNum });
  } catch (error) {
    const errorDetails = logger.error('rebuildMatchLeaders', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to rebuild mv_match_leaders' });
  }
};
