import { Request, Response } from 'express';
import { User, Match, Prediction } from '../models';
import { AuthRequest } from '../middleware/auth';
import { validateRequest, validateScoreSum } from '../utils/validation';

export const submitPrediction = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { Email, matchId, UDF_Score, LDF_Score, NDA_Score } = req.body;

    // Validation
    if (!Email || !matchId || UDF_Score === undefined || LDF_Score === undefined || NDA_Score === undefined) {
      res.status(400).json({
        success: false,
        message: 'Email, matchId, UDF_Score, LDF_Score, NDA_Score are required'
      });
      return;
    }

    // Validate that scores sum to 140
    if (!validateScoreSum([UDF_Score, LDF_Score, NDA_Score])) {
      res.status(400).json({
        success: false,
        message: `Scores must sum to 140. Current sum: ${UDF_Score + LDF_Score + NDA_Score}`
      });
      return;
    }

    // Check if user exists
    const user = await User.findOne({ Email: Email.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found. Please register first.'
      });
      return;
    }

    // Check if match exists
    const match = await Match.findOne({ matchId: matchId });
    if (!match) {
      res.status(404).json({
        success: false,
        message: 'Match not found'
      });
      return;
    }

    if (match.IsFinalized) {
      res.status(400).json({
        success: false,
        message: 'Cannot submit prediction for a finalized match'
      });
      return;
    }

    // Find existing prediction or create new one
    let prediction = await Prediction.findOne({ Email: Email.toLowerCase(), matchId });
    const isNew = !prediction;

    if (prediction) {
      // Update existing
      prediction.UDF_Score = UDF_Score;
      prediction.LDF_Score = LDF_Score;
      prediction.NDA_Score = NDA_Score;
      prediction.Last_Submitted_Time = new Date();
    } else {
      // Create new
      prediction = new Prediction({
        Email: Email.toLowerCase(),
        User_ID: user._id.toString(), // Added User_ID to match model
        matchId,
        UDF_Score,
        LDF_Score,
        NDA_Score,
        Last_Submitted_Time: new Date()
      });
    }

    await prediction.save();

    res.status(200).json({
      success: true,
      message: isNew ? 'Prediction submitted successfully' : 'Prediction updated successfully',
      data: prediction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getUserPredictions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, matchId } = req.query;
    
    // Use email from query or from authenticated user
    const targetEmail = (email as string) || (req as any).user?.Email;

    if (!targetEmail) {
      res.status(400).json({
        success: false,
        message: 'Email is required (query parameter or authenticated session)'
      });
      return;
    }

    const query: any = { Email: targetEmail.toLowerCase() };

    if (matchId && typeof matchId === 'string') {
      query.matchId = matchId;
    }

    const predictions = await Prediction.find(query).sort({ Last_Submitted_Time: -1 });

    res.json({
      success: true,
      count: predictions.length,
      data: predictions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getPredictionAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.query;

    if (!matchId) {
      res.status(400).json({
        success: false,
        message: 'matchId is required'
      });
      return;
    }

    const pipeline = [
      { $match: { matchId: String(matchId) } },
      {
        $group: {
          _id: null,
          totalPredictions: { $sum: 1 },
          avgUDF: { $avg: '$UDF_Score' },
          avgLDF: { $avg: '$LDF_Score' },
          avgNDA: { $avg: '$NDA_Score' },
          udfWins: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$UDF_Score', '$LDF_Score'] }, { $gt: ['$UDF_Score', '$NDA_Score'] }] },
                1,
                0
              ]
            }
          },
          ldfWins: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$LDF_Score', '$UDF_Score'] }, { $gt: ['$LDF_Score', '$NDA_Score'] }] },
                1,
                0
              ]
            }
          },
          ndaWins: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$NDA_Score', '$UDF_Score'] }, { $gt: ['$NDA_Score', '$LDF_Score'] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ];

    const results = await Prediction.aggregate(pipeline);

    if (results.length === 0) {
      res.json({
        success: true,
        data: {
          totalPredictions: 0,
          averages: { UDF: 0, LDF: 0, NDA: 0 },
          winnerDistribution: { UDF: 0, LDF: 0, NDA: 0, Tie: 0 }
        }
      });
      return;
    }

    const data = results[0];
    const totalPredictions = data.totalPredictions;
    const tieCount = totalPredictions - (data.udfWins + data.ldfWins + data.ndaWins);

    res.json({
      success: true,
      data: {
        totalPredictions,
        averages: {
          UDF: Math.round(data.avgUDF * 10) / 10,
          LDF: Math.round(data.avgLDF * 10) / 10,
          NDA: Math.round(data.avgNDA * 10) / 10
        },
        winnerDistribution: {
          UDF: data.udfWins,
          LDF: data.ldfWins,
          NDA: data.ndaWins,
          Tie: tieCount
        }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error generating analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

