import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, Match, Prediction, Community, Result, TopLeader, DailyLeader } from '../models';
import { processMatchResults } from '../services/scoringService';

/**
 * Get all users who have requested a community during registration
 */
export const getCommunityRequests = async (req: AuthRequest, res: Response) => {
    try {
        // Find users who have requested a community and don't have communityId1 set
        const requests = await User.find({
            requestedCommunity: { $exists: true, $ne: '' }
        }).select('userId email firstName lastName requestedCommunity city state createdAt communityId1 communityId2');

        res.json({ requests });
    } catch (error) {
        console.error('Get community requests error:', error);
        res.status(500).json({ error: 'Failed to fetch community requests' });
    }
};

/**
 * Update match scores and trigger points calculation for all predictions
 */
export const finalizeMatch = async (req: AuthRequest, res: Response) => {
    try {
        const { matchId, team1Score, team2Score } = req.body;

        if (team1Score === undefined || team2Score === undefined) {
            return res.status(400).json({ error: 'Both team scores are required' });
        }

        const match = await Match.findOne({ matchId });
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Update match score and status
        match.team1Score = team1Score;
        match.team2Score = team2Score;
        match.status = 'completed';
        await match.save();

        // Trigger points calculation service
        await processMatchResults(matchId);

        // Automatically refresh all leaderboards to ensure Dashboard is up to date
        try {
            const {
                generateTopLeaderboard,
                generateDailyLeaderboard,
                generateCommunityLeaderboard,
                generateDailyCommunityLeaderboard
            } = require('../services/leaderboardService');

            await Promise.all([
                generateTopLeaderboard(),
                generateDailyLeaderboard(),
                generateCommunityLeaderboard(),
                generateDailyCommunityLeaderboard()
            ]);
            console.log('✓ All leaderboards refreshed automatically');

            // Snapshot ranks into Result records for this match
            const [topLeaders, dailyLeaders] = await Promise.all([
                TopLeader.find({}),
                DailyLeader.find({})
            ]);

            const results = await Result.find({ matchId });
            for (const result of results) {
                const topRank = topLeaders.find(tl => tl.userId === result.userId);
                const dailyRank = dailyLeaders.find(dl => dl.userId === result.userId);

                if (topRank || dailyRank) {
                    await Result.updateOne(
                        { _id: result._id },
                        {
                            finalRank: topRank?.rank || 0,
                            dailyRank: dailyRank?.rank || 0
                        }
                    );
                }
            }
            console.log(`✓ Rank snapshots captured for ${results.length} results`);
        } catch (refreshError) {
            console.error('Leaderboard refresh error:', refreshError);
            // Don't fail the whole request if refresh fails
        }

        res.json({
            message: 'Match finalized and points calculated successfully',
            match
        });
    } catch (error) {
        console.error('Finalize match error:', error);
        res.status(500).json({ error: 'Failed to finalize match' });
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

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Optional: Prevent deleting an admin
        if (user.role === 'admin') {
            return res.status(403).json({ error: 'Cannot delete an admin user' });
        }

        await User.deleteOne({ userId });
        // Also delete their predictions if desired
        await Prediction.deleteMany({ userId });

        res.json({ message: 'User and their predictions deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

/**
 * Approve a community request by assigning it to a real community ID
 */
export const approveCommunityRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, communityId } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const community = await Community.findOne({ communityId });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        // Assign to first available slot
        if (!user.communityId1) {
            user.communityId1 = communityId;
        } else {
            user.communityId2 = communityId;
        }

        // Clear requestedCommunity once approved
        user.requestedCommunity = undefined;
        await user.save();

        res.json({ message: 'Community request approved successfully', user });
    } catch (error) {
        console.error('Approve community error:', error);
        res.status(500).json({ error: 'Failed to approve community request' });
    }
};

/**
 * Create a new community and approve the user's request in one step
 */
export const createAndApproveCommunityRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { userId, name, state, city } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Community name is required' });
        }

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Create new community record
        const communityId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const community = new Community({
            communityId,
            name,
            state: state || user.state || 'Unknown',
            city: city || user.city || 'Unknown'
        });
        await community.save();

        // Assign user to newly created community (to first available slot)
        if (!user.communityId1) {
            user.communityId1 = communityId;
        } else {
            user.communityId2 = communityId;
        }

        // Clear requestedCommunity
        user.requestedCommunity = undefined;
        await user.save();

        res.json({ message: 'Community created and user assigned successfully', user, community });
    } catch (error: any) {
        console.error('Create and approve community error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'A community with a similar ID or name already exists' });
        }
        res.status(500).json({ error: 'Failed to create and approve community' });
    }
};
