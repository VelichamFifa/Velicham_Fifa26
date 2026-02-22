import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Prediction, Match, User, Result } from '../models';

export const submitPrediction = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, team1Score, team2Score, comment } = req.body;
    const userId = req.user?.userId;
    const email = req.user?.email;

    if (!userId || !email) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const match = await Match.findOne({ matchId });
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // Check if prediction deadline has passed
    if (new Date() > match.predictionsEndingTime) {
      return res.status(400).json({ error: 'Prediction deadline has passed' });
    }

    // Check if user already predicted for this match
    const existingPrediction = await Prediction.findOne({ userId, matchId });
    if (existingPrediction) {
      return res.status(400).json({ error: 'You have already made a prediction for this match' });
    }

    const prediction = new Prediction({
      userId,
      email,
      matchId,
      matchTag: match.matchTag,
      team1Score,
      team2Score,
      comment,
      points: 0,
    });

    await prediction.save();

    res.status(201).json({
      message: 'Prediction submitted successfully',
      prediction,
    });
  } catch (error) {
    console.error('Submit prediction error:', error);
    res.status(500).json({ error: 'Failed to submit prediction' });
  }
};

export const getUserPredictions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { matchId, page = '1', limit = '10' } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = { userId };
    if (matchId) {
      filter.matchId = matchId;
    }

    const predictions = await Prediction.find(filter)
      .sort({ createdAt: -1 }) // Sort by newest prediction first
      .skip(skip)
      .limit(limitNum);

    // Manually populate matchId
    const matchIds = [...new Set(predictions.map(p => p.matchId))];
    const [matches, results] = await Promise.all([
      Match.find({ matchId: { $in: matchIds } }),
      Result.find({ userId, matchId: { $in: matchIds } })
    ]);

    const populatedPredictions = predictions.map(prediction => {
      const match = matches.find(m => m.matchId === prediction.matchId);
      const result = results.find(r => r.matchId === prediction.matchId);

      return {
        ...prediction.toObject(),
        matchId: match || prediction.matchId,
        historicRank: result ? {
          finalRank: result.finalRank,
          dailyRank: result.dailyRank
        } : null
      };
    });

    // Sort by match time descending for history view
    populatedPredictions.sort((a: any, b: any) => {
      const timeA = a.matchId?.matchTime ? new Date(a.matchId.matchTime).getTime() : 0;
      const timeB = b.matchId?.matchTime ? new Date(b.matchId.matchTime).getTime() : 0;
      return timeB - timeA;
    });

    const total = await Prediction.countDocuments(filter);

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
    console.error('Get predictions error:', error);
    res.status(500).json({ error: 'Failed to fetch predictions' });
  }
};

export const updatePrediction = async (req: AuthRequest, res: Response) => {
  try {
    const { predictionId } = req.params;
    const { team1Score, team2Score, comment } = req.body;
    const userId = req.user?.userId;

    const prediction = await Prediction.findById(predictionId);
    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    if (prediction.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this prediction' });
    }

    const match = await Match.findOne({ matchId: prediction.matchId });
    if (match && new Date() > match.predictionsEndingTime) {
      return res.status(400).json({ error: 'Cannot update prediction after deadline' });
    }

    if (team1Score !== undefined) prediction.team1Score = team1Score;
    if (team2Score !== undefined) prediction.team2Score = team2Score;
    if (comment !== undefined) prediction.comment = comment;

    await prediction.save();

    res.json({
      message: 'Prediction updated successfully',
      prediction,
    });
  } catch (error) {
    console.error('Update prediction error:', error);
    res.status(500).json({ error: 'Failed to update prediction' });
  }
};

export const deletePrediction = async (req: AuthRequest, res: Response) => {
  try {
    const { predictionId } = req.params;
    const userId = req.user?.userId;

    const prediction = await Prediction.findById(predictionId);
    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found' });
    }

    if (prediction.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this prediction' });
    }

    const match = await Match.findOne({ matchId: prediction.matchId });
    if (match && new Date() > match.predictionsEndingTime) {
      return res.status(400).json({ error: 'Cannot delete prediction after deadline' });
    }

    await Prediction.deleteOne({ _id: predictionId });

    res.json({ message: 'Prediction deleted successfully' });
  } catch (error) {
    console.error('Delete prediction error:', error);
    res.status(500).json({ error: 'Failed to delete prediction' });
  }
};
