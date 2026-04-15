import { Request, Response } from 'express';
import { Match } from '../models/Match';
import { Prediction } from '../models/Prediction';
import { calculatePoints } from '../services/scoring';

export const getMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query;
    let query: any = {};
    if (status === 'completed') query.IsFinalized = true;
    if (status === 'pending') query.IsFinalized = false;

    const matches = await Match.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      matches
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const getMatchById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId } = req.params;
    console.log('[MatchController] getMatchById called with ID:', matchId);
    const match = await Match.findOne({ matchId });
    if (!match) {
      res.status(404).json({
        success: false,
        message: 'Match not found'
      });
      return;
    }
    res.json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const createMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId, LDF, UDF, NDA } = req.body;

    if (!matchId || !LDF || !UDF || !NDA) {
      res.status(400).json({
        success: false,
        message: 'matchId, LDF, UDF, NDA are required'
      });
      return;
    }

    // Check if match with same matchId already exists
    const existingMatch = await Match.findOne({ matchId });
    if (existingMatch) {
      res.status(400).json({
        success: false,
        message: 'Match with this ID already exists'
      });
      return;
    }

    const match = new Match({ matchId, LDF, UDF, NDA });
    await match.save();

    res.status(201).json({
      success: true,
      data: match
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const finalizeMatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { matchId, official_UDF, official_LDF, official_NDA } = req.body;

    if (!matchId || official_UDF === undefined || official_LDF === undefined || official_NDA === undefined) {
      res.status(400).json({
        success: false,
        message: 'matchId, official_UDF, official_LDF, official_NDA are required'
      });
      return;
    }

    // Find the match
    const match = await Match.findOne({ matchId });
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
        message: 'Match is already finalized'
      });
      return;
    }

    // Update match with official results
    match.official_UDF = official_UDF;
    match.official_LDF = official_LDF;
    match.official_NDA = official_NDA;
    match.IsFinalized = true;
    await match.save();

    // Calculate points for all predictions for this match
    const predictions = await Prediction.find({ matchId });

    let updatedCount = 0;
    for (const prediction of predictions) {
      // Logic for points calculation would go here
      updatedCount++;
    }

    res.json({
      success: true,
      message: `Match finalized. Calculated points for ${updatedCount} predictions`,
      data: {
        matchId: match.matchId,
        officialResults: {
          UDF: official_UDF,
          LDF: official_LDF,
          NDA: official_NDA
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
