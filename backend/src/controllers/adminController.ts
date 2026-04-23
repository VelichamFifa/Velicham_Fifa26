import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { processMatchResults } from '../services/scoringService';
import { capitalizeProperNoun } from '../utils/stringUtils';
import { findExistingCommunityForRequest } from '../utils/communityLookup';

export const getCommunityRequests = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        communityRequest: {
          is: {
            name: { not: { equals: '' } },
          },
        },
      },
      include: { communityRequest: true },
      orderBy: { createdAt: 'desc' },
    });

    const requests = users.map((u) => ({
      userId: u.userId,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      city: u.city,
      state: u.state,
      createdAt: u.createdAt,
      communityId1: u.communityId1,
      communityId2: u.communityId2,
      requestedCommunity: u.communityRequest
        ? {
            name: u.communityRequest.name,
            shortName: u.communityRequest.shortName,
            description: u.communityRequest.description,
            isOnline: u.communityRequest.isOnline,
            city: u.communityRequest.city,
            state: u.communityRequest.state,
            existingCommunityId: u.communityRequest.existingCommunityId,
          }
        : undefined,
    }));

    res.json({ requests });
  } catch (error) {
    console.error('Get community requests error:', error);
    res.status(500).json({ error: 'Failed to fetch community requests' });
  }
};

export const finalizeMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, team1Score, team2Score } = req.body;
    if (team1Score === undefined || team2Score === undefined) {
      return res.status(400).json({ error: 'Both team scores are required' });
    }

    const match = await prisma.match.findUnique({ where: { matchId } });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const updated = await prisma.match.update({
      where: { matchId },
      data: { team1Score, team2Score, status: 'completed' },
    });

    await processMatchResults(matchId);

    res.json({
      message: 'Match finalized and points calculated successfully',
      match: updated,
    });
  } catch (error) {
    console.error('Finalize match error:', error);
    res.status(500).json({ error: 'Failed to finalize match' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete an admin user' });

    await prisma.$transaction([
      prisma.prediction.deleteMany({ where: { userId } }),
      prisma.result.deleteMany({ where: { userId } }),
      prisma.topLeader.deleteMany({ where: { userId } }),
      prisma.dailyLeader.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { userId } }),
    ]);

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const approveCommunityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, communityId } = req.body;

    const [user, community] = await Promise.all([
      prisma.user.findUnique({ where: { userId }, include: { communityRequest: true } }),
      prisma.community.findUnique({ where: { communityId } }),
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!community) return res.status(404).json({ error: 'Community not found' });

    let assigned = false;
    if (user.communityId1 === communityId || user.communityId2 === communityId) {
      assigned = false;
    } else if (!user.communityId1) {
      await prisma.user.update({ where: { userId }, data: { communityId1: communityId } });
      assigned = true;
    } else if (!user.communityId2) {
      await prisma.user.update({ where: { userId }, data: { communityId2: communityId } });
      assigned = true;
    }

    if (user.communityRequest) {
      await prisma.userCommunityRequest.delete({ where: { userId } });
    }

    res.json({
      message: assigned
        ? 'Community request approved successfully'
        : 'Community request handled (slots full or already assigned), request cleared',
    });
  } catch (error) {
    console.error('Approve community error:', error);
    res.status(500).json({ error: 'Failed to approve community request' });
  }
};

export const createAndApproveCommunityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, name, fullName, state, city, address, isOnline, shortName, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Community name is required' });

    const user = await prisma.user.findUnique({ where: { userId }, include: { communityRequest: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If this community already exists (case-insensitive), reuse it
    let communityId: string | null = null;
    if (shortName) {
      const existing = await findExistingCommunityForRequest(name, shortName);
      communityId = existing?.communityId ?? null;
    }

    if (!communityId) {
      communityId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      await prisma.community.create({
        data: {
          communityId,
          name: capitalizeProperNoun(shortName || name),
          fullName: capitalizeProperNoun(fullName || name),
          isOnline: !!isOnline,
          state: capitalizeProperNoun(state || 'Unknown'),
          city: capitalizeProperNoun(city || 'Unknown'),
          address: address || '',
          description: description || '',
        },
      });
    }

    if (user.communityId1 === communityId || user.communityId2 === communityId) {
      // noop
    } else if (!user.communityId1) {
      await prisma.user.update({ where: { userId }, data: { communityId1: communityId } });
    } else if (!user.communityId2) {
      await prisma.user.update({ where: { userId }, data: { communityId2: communityId } });
    }

    if (user.communityRequest) {
      await prisma.userCommunityRequest.delete({ where: { userId } });
    }

    res.json({ message: 'Community created and request approved successfully', communityId });
  } catch (error) {
    console.error('Create and approve community error:', error);
    res.status(500).json({ error: 'Failed to create and approve community request' });
  }
};

export const rejectCommunityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({ where: { userId }, include: { communityRequest: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.communityRequest) {
      await prisma.userCommunityRequest.delete({ where: { userId } });
    }
    res.json({ message: 'Community request rejected and cleared' });
  } catch (error) {
    console.error('Reject community error:', error);
    res.status(500).json({ error: 'Failed to reject community request' });
  }
};

