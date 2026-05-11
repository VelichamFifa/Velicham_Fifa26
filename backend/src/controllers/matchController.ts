import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export const getAllMatches = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where = status ? { status: status as string } : {};

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        orderBy: { matchTime: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.match.count({ where }),
    ]);

    res.json({
      matches,
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
    const { matchId } = req.params;
    const match = await prisma.match.findUnique({ where: { matchId } });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
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
    const { matchId, sequence, team1, team2, matchTime, predictionsEndingTime, round, matchTag, comment } = req.body;

    const existingMatch = await prisma.match.findUnique({ where: { matchId } });
    if (existingMatch) {
      return res.status(400).json({ error: 'Match already exists' });
    }

    const match = await prisma.match.create({
      data: {
        matchId,
        sequence,
        team1,
        team2,
        matchTime: new Date(matchTime),
        predictionsEndingTime: new Date(predictionsEndingTime),
        round,
        matchTag,
        comment,
        status: 'scheduled',
      },
    });

    res.status(201).json({
      message: 'Match created successfully',
      match,
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
    const { matchId } = req.params;
    const { team1Score, team2Score, status } = req.body;

    const match = await prisma.match.findUnique({ where: { matchId } });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const updated = await prisma.match.update({
      where: { matchId },
      data: {
        ...(team1Score !== undefined ? { team1Score } : {}),
        ...(team2Score !== undefined ? { team2Score } : {}),
        ...(status ? { status } : {}),
      },
    });

    res.json({
      message: 'Match updated successfully',
      match: updated,
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
