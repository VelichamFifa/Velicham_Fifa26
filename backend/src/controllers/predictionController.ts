import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export const submitPrediction = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, team1Score, team2Score, comment } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userIdNum = Number(userId);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const matchIdNum = Number(matchId);
    if (!Number.isInteger(matchIdNum) || matchIdNum <= 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = await prisma.match.findUnique({ where: { id: matchIdNum } });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if prediction deadline has passed
    if (new Date() > match.predictionsEndingTime) {
      return res.status(400).json({ error: 'Prediction deadline has passed' });
    }

    // Check if user already predicted for this match - if so, update it (upsert pattern)
    const existingPrediction = await prisma.prediction.findUnique({
      where: { userId_matchId: { userId: userIdNum, matchId: matchIdNum } },
    });
    if (existingPrediction) {
      const updated = await prisma.prediction.update({
        where: { id: existingPrediction.id },
        data: {
          team1Score,
          team2Score,
          comment,
          submittedTime: new Date(),
          matchTag: match.matchTag,
        },
      });

      return res.status(200).json({
        message: 'Prediction updated successfully',
        prediction: updated,
      });
    }

    const prediction = await prisma.prediction.create({
      data: {
        userId: userIdNum,
        matchId: matchIdNum,
        matchTag: match.matchTag,
        team1Score,
        team2Score,
        comment,
        points: 0,
      },
    });

    res.status(201).json({
      message: 'Prediction submitted successfully',
      prediction,
    });
  } catch (error) {
    const errorDetails = logger.error('submitPrediction', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      email: req.user?.email,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to submit prediction' });
  }
};

export const getUserPredictions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { matchId, page = '1', limit = '10' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userIdNum = Number(userId);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { userId: userIdNum };
    if (matchId) {
      const matchIdNum = Number(matchId);
      if (Number.isInteger(matchIdNum) && matchIdNum > 0) {
        where.matchId = matchIdNum;
      }
    }

    const [predictions, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: { match: true },
      }),
      prisma.prediction.count({ where }),
    ]);

    const results = await prisma.result.findMany({
      where: { userId: userIdNum, matchId: { in: predictions.map((p) => p.matchId) } },
      select: { matchId: true, finalRank: true, dailyRank: true },
    });

    const resultByMatchId = new Map(results.map((r) => [r.matchId, r]));

    const populatedPredictions = predictions
      .map((p) => {
        const apiMatch = p.match ? { ...p.match, matchId: String(p.match.id) } : null;
        return {
          ...p,
          matchId: apiMatch, // keep frontend shape compatibility (it expects match object sometimes)
          match: undefined,
          historicRank: resultByMatchId.get(p.matchId)
            ? { finalRank: resultByMatchId.get(p.matchId)!.finalRank, dailyRank: resultByMatchId.get(p.matchId)!.dailyRank }
            : null,
        };
      })
      .sort((a: any, b: any) => {
        const timeA = a.matchId?.matchTime ? new Date(a.matchId.matchTime).getTime() : 0;
        const timeB = b.matchId?.matchTime ? new Date(b.matchId.matchTime).getTime() : 0;
        return timeB - timeA;
      });

    res.json({
      predictions: populatedPredictions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    const errorDetails = logger.error('getUserPredictions', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch predictions' });
  }
};

export const updatePrediction = async (req: AuthRequest, res: Response) => {
  try {
    const { predictionId } = req.params;
    const { team1Score, team2Score, comment } = req.body;
    const userId = req.user?.userId;

    const prediction = await prisma.prediction.findUnique({ where: { id: Number(predictionId) } });
    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    if (prediction.userId !== Number(userId)) {
      return res.status(403).json({ error: 'Unauthorized to update this prediction' });
    }

    const match = await prisma.match.findUnique({ where: { id: prediction.matchId } });
    if (match && new Date() > match.predictionsEndingTime) {
      return res.status(400).json({ error: 'Cannot update prediction after deadline' });
    }

    const updated = await prisma.prediction.update({
      where: { id: prediction.id },
      data: {
        ...(team1Score !== undefined ? { team1Score } : {}),
        ...(team2Score !== undefined ? { team2Score } : {}),
        ...(comment !== undefined ? { comment } : {}),
      },
    });

    res.json({
      message: 'Prediction updated successfully',
      prediction: updated,
    });
  } catch (error) {
    const errorDetails = logger.error('updatePrediction', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      predictionId: req.params.predictionId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to update prediction' });
  }
};

export const deletePrediction = async (req: AuthRequest, res: Response) => {
  try {
    const { predictionId } = req.params;
    const userId = req.user?.userId;

    const prediction = await prisma.prediction.findUnique({ where: { id: Number(predictionId) } });
    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    if (prediction.userId !== Number(userId)) {
      return res.status(403).json({ error: 'Unauthorized to delete this prediction' });
    }

    const match = await prisma.match.findUnique({ where: { id: prediction.matchId } });
    if (match && new Date() > match.predictionsEndingTime) {
      return res.status(400).json({ error: 'Cannot delete prediction after deadline' });
    }

    await prisma.prediction.delete({ where: { id: prediction.id } });

    res.json({ message: 'Prediction deleted successfully' });
  } catch (error) {
    const errorDetails = logger.error('deletePrediction', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      predictionId: req.params.predictionId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to delete prediction' });
  }
};
