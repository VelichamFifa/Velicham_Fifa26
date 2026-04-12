import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, Match, Prediction, Community } from '../models';
import { calculatePoints } from '../services/scoring';
import { populateCommunityLeaderTable } from '../services/leaderboardService';

/**
 * Update match scores and trigger points calculation for all predictions
 */
export const finalizeMatch = async (req: AuthRequest, res: Response) => {
    try {
        const { matchId, official_UDF, official_LDF, official_NDA } = req.body;

        if (official_UDF === undefined || official_LDF === undefined || official_NDA === undefined) {
            return res.status(400).json({ error: 'All party official scores are required' });
        }

        const match = await Match.findOne({ matchId });
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Update match scores and status
        match.official_UDF = official_UDF;
        match.official_LDF = official_LDF;
        match.official_NDA = official_NDA;
        match.IsFinalized = true;
        await match.save();

        // Trigger points calculation service for all predictions of this match
        const predictions = await Prediction.find({ matchId });
        
        console.log(`Finalizing match ${matchId}. Found ${predictions.length} predictions to calculate.`);

        for (const prediction of predictions) {
            const pointsEarned = calculatePoints(
                prediction.UDF_Score,
                prediction.LDF_Score,
                prediction.NDA_Score,
                official_UDF,
                official_LDF,
                official_NDA
            );

            // Update prediction
            prediction.Total_Points = pointsEarned;
            await prediction.save();
        }

        // Populate CommunityLeader table
        await populateCommunityLeaderTable(matchId);

        res.json({
            message: 'Election results finalized and points calculated successfully',
            match
        });
    } catch (error) {
        console.error('Finalize match error:', error);
        res.status(500).json({ error: 'Failed to finalize election' });
    }
};

/**
 * Get all users for management
 */
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json({ users });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

/**
 * Delete a user from the system
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        const user = await User.findOne({ User_ID: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting an admin
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete an admin user' });
        }

        const userEmail = user.Email;

        await User.deleteOne({ User_ID: userId });
        
        // Delete all associated predictions using email
        await Prediction.deleteMany({ Email: userEmail });

        res.json({ message: 'User and associated predictions deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
