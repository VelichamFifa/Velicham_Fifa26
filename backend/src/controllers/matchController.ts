export const deleteMatch = async (req: AuthRequest, res: Response) => {
  try {
    const matchIdNum = Number(req.params.matchId);
    if (!Number.isInteger(matchIdNum) || matchIdNum <= 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = await prisma.match.findUnique({ where: { id: matchIdNum } });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await prisma.match.delete({ where: { id: matchIdNum } });
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    const errorDetails = logger.error('deleteMatch', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      matchId: req.params.matchId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to delete match' });
  }
};
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { BlobServiceClient } from '@azure/storage-blob';

const withApiMatchId = <T extends { id: number }>(match: T) => ({
  ...match,
  matchId: String(match.id),
});

const buildMatchTag = (team1: string, team2: string) => `#${team1}_${team2}`;

export const getAllTeams = async (req: AuthRequest, res: Response) => {
  try {
    const teams = await prisma.team.findMany({
      select: { teamId: true, teamName: true, countryLogo: true },
      orderBy: { teamName: 'asc' },
    });

    res.json({ teams });
  } catch (error) {
    const errorDetails = logger.error('getAllTeams', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch teams' });
  }
};

export const getAllMatches = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '10', status } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = status ? { status: status as string } : undefined;

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        orderBy: { matchTime: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.match.count({ where }),
    ]);

    const teamIds = [...new Set(matches.flatMap((m) => [m.team1, m.team2]))];
    const teams = await prisma.team.findMany({ where: { teamId: { in: teamIds } } });
    const teamMap = Object.fromEntries(
      teams.map((t) => [t.teamId, { teamName: t.teamName, countryLogo: t.countryLogo }])
    );

    const enrichedMatches = matches.map((m) => ({
      ...withApiMatchId(m),
      team1Info: teamMap[m.team1] ?? null,
      team2Info: teamMap[m.team2] ?? null,
    }));

    res.json({
      matches: enrichedMatches,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    const errorDetails = logger.error('getAllMatches', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch matches' });
  }
};

export const getMatchById = async (req: AuthRequest, res: Response) => {
  try {
    const matchIdNum = Number(req.params.matchId);
    if (!Number.isInteger(matchIdNum) || matchIdNum <= 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = await prisma.match.findUnique({ where: { id: matchIdNum } });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(withApiMatchId(match));
  } catch (error) {
    const errorDetails = logger.error('getMatchById', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      matchId: req.params.matchId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch match' });
  }
};

export const getLatestCompletedMatch = async (req: AuthRequest, res: Response) => {
  try {
    const match = await prisma.match.findFirst({
      where: { status: 'completed' },
      orderBy: { completedAt: 'desc' },
      select: { matchTag: true },
    });

    if (!match) {
      return res.status(404).json({ error: 'No completed match found' });
    }

    res.json({ matchTag: match.matchTag });
  } catch (error) {
    const errorDetails = logger.error('getLatestCompletedMatch', error, {
      method: req.method,
      path: req.path,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch latest completed match' });
  }
};

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { sequence, team1, team2, matchTime, predictionsEndingTime, round, group, matchTag, comment } = req.body;
    const resolvedMatchTag = matchTag || buildMatchTag(team1, team2);

    const match = await prisma.match.create({
      data: {
        sequence,
        team1,
        team2,
        matchTime: new Date(matchTime),
        predictionsEndingTime: new Date(predictionsEndingTime),
        round,
        group,
        matchTag: resolvedMatchTag,
        comment,
        status: 'onboarded',
      },
    });

    res.status(201).json({
      message: 'Match created successfully',
      match: withApiMatchId(match),
    });
  } catch (error) {
    const errorDetails = logger.error('createMatch', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to create match' });
  }
};

export const updateMatch = async (req: AuthRequest, res: Response) => {
  try {
    const matchIdNum = Number(req.params.matchId);
    if (!Number.isInteger(matchIdNum) || matchIdNum <= 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const {
      sequence,
      team1,
      team2,
      matchTime,
      predictionsEndingTime,
      round,
      group,
      matchTag,
      comment,
      team1Score,
      team2Score,
      status,
    } = req.body;

    const match = await prisma.match.findUnique({ where: { id: matchIdNum } });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const updated = await prisma.match.update({
      where: { id: matchIdNum },
      data: {
        ...(sequence !== undefined ? { sequence } : {}),
        ...(team1 !== undefined ? { team1 } : {}),
        ...(team2 !== undefined ? { team2 } : {}),
        ...(matchTime !== undefined ? { matchTime: new Date(matchTime) } : {}),
        ...(predictionsEndingTime !== undefined ? { predictionsEndingTime: new Date(predictionsEndingTime) } : {}),
        ...(round !== undefined ? { round } : {}),
        ...(group !== undefined ? { group } : {}),
        ...(comment !== undefined ? { comment } : {}),
        ...((team1 !== undefined || team2 !== undefined || matchTag !== undefined)
          ? { matchTag: matchTag || buildMatchTag(team1 ?? match.team1, team2 ?? match.team2) }
          : {}),
        ...(team1Score !== undefined ? { team1Score } : {}),
        ...(team2Score !== undefined ? { team2Score } : {}),
        ...(status ? { status } : {}),
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
        ...(status !== undefined && status !== 'completed' ? { completedAt: null } : {}),
      },
    });

    res.json({
      message: 'Match updated successfully',
      match: withApiMatchId(updated),
    });
  } catch (error) {
    const errorDetails = logger.error('updateMatch', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      matchId: req.params.matchId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to update match' });
  }
};

export const archiveMatchPredictions = async (req: AuthRequest, res: Response) => {
  try {
    const matchIdNum = Number(req.params.matchId);
    if (!Number.isInteger(matchIdNum) || matchIdNum <= 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // 1. Fetch match and predictions
    const match = await prisma.match.findUnique({ where: { id: matchIdNum } });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const predictions = await prisma.prediction.findMany({
      where: { matchId: matchIdNum },
      include: {
        user: {
          select: { email: true, firstName: true, lastName: true }
        }
      }
    });

    // 2. Format data to JSON
    const archiveData = {
      matchId: String(match.id),
      team1: match.team1,
      team2: match.team2,
      archivedAt: new Date().toISOString(),
      totalPredictions: predictions.length,
      predictions: predictions.map((p: any) => ({
        predictionId: p.id,
        userId: p.userId,
        userEmail: p.user?.email,
        userName: `${p.user?.firstName} ${p.user?.lastName}`.trim(),
        team1Score: p.team1Score,
        team2Score: p.team2Score,
        submittedAt: p.createdAt
      }))
    };

    const jsonString = JSON.stringify(archiveData, null, 2);

    // 3. Upload to Azure Blob Storage
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'match-archives';

    if (!connectionString) {
      return res.status(500).json({ error: 'Azure Storage connection string is missing' });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Create container if it doesn't exist
    await containerClient.createIfNotExists();

    const blobName = `match_${match.id}_predictions_${Date.now()}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.upload(jsonString, Buffer.byteLength(jsonString));

    res.json({
      message: 'Predictions successfully generated and uploaded to Blob Storage',
      blobName
    });

  } catch (error) {
    const errorDetails = logger.error('archiveMatchPredictions', error, {
      method: req.method,
      path: req.path,
      matchId: req.params.matchId
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to archive match predictions to blob storage' });
  }
};
