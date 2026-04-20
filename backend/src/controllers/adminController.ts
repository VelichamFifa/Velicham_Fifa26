import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, Match, Prediction, Community, Result, TopLeader, DailyLeader } from '../models';
import { processMatchResults } from '../services/scoringService';
import { capitalizeProperNoun } from '../utils/stringUtils';

/**
 * Get all users who have requested a community during registration
 */
export const getCommunityRequests = async (req: AuthRequest, res: Response) => {
    try {
        // Find users who have requested a community and don't have communityId1 set
        const requests = await User.find({
            'requestedCommunity.name': { $exists: true, $ne: '' }
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
                generateDailyCommunityLeaderboard,
                generateMatchLeaderboard
            } = require('../services/leaderboardService');

            await Promise.all([
                generateTopLeaderboard(),
                generateDailyLeaderboard(),
                generateCommunityLeaderboard(),
                generateDailyCommunityLeaderboard()
            ]);
            console.log('✓ All leaderboards refreshed automatically');

            // Generate snapshots for both Match and Overall Rank
            const [matchLeaderboard, topLeaders] = await Promise.all([
                generateMatchLeaderboard(matchId),
                TopLeader.find({}).select('userId rank totalPoints')
            ]);

            const results = await Result.find({ matchId });
            for (const result of results) {
                const matchRankObj = matchLeaderboard.find((ml: any) => ml.userId === result.userId);
                const topRankObj = topLeaders.find((tl) => tl.userId === result.userId);

                if (matchRankObj || topRankObj) {
                    await Result.updateOne(
                        { _id: result._id },
                        {
                            dailyRank: matchRankObj?.rank || 0, // Match Rank
                            finalRank: topRankObj?.rank || 0,   // Overall Rank
                            finalPoints: topRankObj?.totalPoints || result.matchPoints // Correct Cumulative Points
                        }
                    );
                }
            }
            console.log(`✓ Rank snapshots (Match and Overall) captured for ${results.length} results`);
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
        // Delete all associated data
        await Promise.all([
            Prediction.deleteMany({ userId }),
            Result.deleteMany({ userId }),
            TopLeader.deleteMany({ userId }),
            DailyLeader.deleteMany({ userId })
        ]);

        // Refresh leaderboards automatically to remove user from rankings
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
            console.log(`✓ Leaderboards refreshed after deleting user ${userId}`);
        } catch (refreshError) {
            console.error('Leaderboard refresh error after deletion:', refreshError);
        }

        res.json({ message: 'User and all associated data deleted successfully, leaderboards refreshed' });
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
        console.log('Approve community request:', req.body);
        const { userId, communityId } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const community = await Community.findOne({ communityId });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }

        // Assign to first available slot ONLY if not already assigned and slots are available
        let assigned = false;
        if (user.communityId1 === communityId || user.communityId2 === communityId) {
            // Already assigned to one of the slots, skip assignment but we will still clear the request
            console.log(`User ${userId} already assigned to community ${communityId}, skipping assignment`);
        } else if (!user.communityId1) {
            user.communityId1 = communityId;
            assigned = true;
        } else if (!user.communityId2) {
            user.communityId2 = communityId;
            assigned = true;
        }

        // ALWAYS clear requestedCommunity once handled by admin (fulfilled or skipped due to full slots)
        (user as any).requestedCommunity = undefined;
        await user.save();

        const message = assigned 
            ? 'Community request approved successfully' 
            : 'Community request handled (User slots full or already assigned, request cleared)';

        res.json({ message, user });
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
        const { userId, name, state, city, shortName, description, isOnline } = req.body;

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
            name: capitalizeProperNoun(shortName || name), // Short name becomes the primary name
            fullName: capitalizeProperNoun(name),          // Original name becomes fullName
            isOnline: !!isOnline,    // Capture online status
            state: capitalizeProperNoun(state) || 'Unknown',
            city: capitalizeProperNoun(city) || 'Unknown',
            description: description || ''
        });
        await community.save();

        // Assign user to newly created community (to first available EMPTY slot)
        let assigned = false;
        if (!user.communityId1) {
            user.communityId1 = communityId;
            assigned = true;
        } else if (!user.communityId2) {
            user.communityId2 = communityId;
            assigned = true;
        }

        // ALWAYS clear requestedCommunity once handled by admin
        (user as any).requestedCommunity = undefined;
        await user.save();

        const message = assigned
            ? 'Community created and user assigned successfully'
            : 'Community created (User slots full, assignment skipped, request cleared)';

        res.json({ message, user, community });
    } catch (error: any) {
        console.error('Create and approve community error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'A community with a similar ID or name already exists' });
        }
        res.status(500).json({ error: 'Failed to create and approve community' });
    }
};

/**
 * Reject a community request (simply clears the pending request)
 */
export const rejectCommunityRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.body;

        const user = await User.findOne({ userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Clear the requestedCommunity field
        (user as any).requestedCommunity = undefined;
        await user.save();

        res.json({ message: 'Community request rejected and cleared successfully', user });
    } catch (error) {
        console.error('Reject community error:', error);
        res.status(500).json({ error: 'Failed to reject community request' });
    }
};
