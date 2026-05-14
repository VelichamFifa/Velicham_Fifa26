import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

const withApiMatchId = <T extends { id: number }>(match: T) => ({
  ...match,
  matchId: String(match.id),
});

export const getAllMatches = async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = { status: 'scheduled' as const };

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        orderBy: { matchTime: 'desc' },
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

export const createMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { sequence, team1, team2, matchTime, predictionsEndingTime, round, group, matchTag, comment } = req.body;

    const match = await prisma.match.create({
      data: {
        sequence,
        team1,
        team2,
        matchTime: new Date(matchTime),
        predictionsEndingTime: new Date(predictionsEndingTime),
        round,
        group,
        matchTag,
        comment,
        status: 'scheduled',
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

    const { team1Score, team2Score, status } = req.body;

    const match = await prisma.match.findUnique({ where: { id: matchIdNum } });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const updated = await prisma.match.update({
      where: { id: matchIdNum },
      data: {
        ...(team1Score !== undefined ? { team1Score } : {}),
        ...(team2Score !== undefined ? { team2Score } : {}),
        ...(status ? { status } : {}),
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
