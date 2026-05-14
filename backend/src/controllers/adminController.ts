import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
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
      userId: String(u.id),
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
    const errorDetails = logger.error('getCommunityRequests', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch community requests' });
  }
};

export const finalizeMatch = async (req: AuthRequest, res: Response) => {
  try {
    const { matchId, team1Score, team2Score } = req.body;
    if (team1Score === undefined || team2Score === undefined) {
      return res.status(400).json({ error: 'Both team scores are required' });
    }

    const matchIdNum = Number(matchId);
    if (!Number.isInteger(matchIdNum) || matchIdNum <= 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = await prisma.match.findUnique({ where: { id: matchIdNum } });
    if (!match) return res.status(404).json({ error: 'Match not found' });

    const updated = await prisma.match.update({
      where: { id: matchIdNum },
      data: { team1Score, team2Score, status: 'completed' },
    });

    await processMatchResults(matchIdNum);

    res.json({
      message: 'Match finalized and points calculated successfully',
      match: { ...updated, matchId: String(updated.id) },
    });
  } catch (error) {
    const errorDetails = logger.error('finalizeMatch', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      matchId: req.body?.matchId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to finalize match' });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({
      users: users.map((u) => ({
        ...u,
        userId: String(u.id),
      })),
    });
  } catch (error) {
    const errorDetails = logger.error('getAllUsers', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch users' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const userIdNum = Number(userId);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = await prisma.user.findUnique({ where: { id: userIdNum } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot delete an admin user' });

    await prisma.$transaction([
      prisma.prediction.deleteMany({ where: { userId: userIdNum } }),
      prisma.result.deleteMany({ where: { userId: userIdNum } }),
      prisma.topLeader.deleteMany({ where: { userId } }),
      prisma.dailyLeader.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userIdNum } }),
    ]);

    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    const errorDetails = logger.error('deleteUser', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      targetUserId: req.params.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to delete user' });
  }
};

export const approveCommunityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, communityId } = req.body;
    const userIdNum = Number(userId);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const communityIdNum = Number(communityId);
    if (!Number.isInteger(communityIdNum) || communityIdNum <= 0) {
      return res.status(404).json({ error: 'Community not found' });
    }

    const [user, community] = await Promise.all([
      prisma.user.findUnique({ where: { id: userIdNum }, include: { communityRequest: true } }),
      prisma.community.findUnique({ where: { id: communityIdNum } }),
    ]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!community) return res.status(404).json({ error: 'Community not found' });

    const normalizedCommunityId = community.id;

    let assigned = false;
    if (user.communityId1 === normalizedCommunityId || user.communityId2 === normalizedCommunityId) {
      assigned = false;
    } else if (!user.communityId1) {
      await prisma.user.update({ where: { id: userIdNum }, data: { communityId1: normalizedCommunityId } });
      assigned = true;
    } else if (!user.communityId2) {
      await prisma.user.update({ where: { id: userIdNum }, data: { communityId2: normalizedCommunityId } });
      assigned = true;
    }

    if (user.communityRequest) {
      await prisma.userCommunityRequest.delete({ where: { userId: userIdNum } });
    }

    res.json({
      message: assigned
        ? 'Community request approved successfully'
        : 'Community request handled (slots full or already assigned), request cleared',
    });
  } catch (error) {
    const errorDetails = logger.error('approveCommunityRequest', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      targetUserId: req.body?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to approve community request' });
  }
};

export const createAndApproveCommunityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, name, fullName, state, city, address, isOnline, shortName, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Community name is required' });

    const userIdNum = Number(userId);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await prisma.user.findUnique({ where: { id: userIdNum }, include: { communityRequest: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // If this community already exists (case-insensitive), reuse it
    let communityId: number | null = null;
    if (shortName) {
      const existing = await findExistingCommunityForRequest(name, shortName);
      communityId = existing?.communityId ? Number(existing.communityId) : null;
    }

    if (!communityId) {
      const createdCommunity = await prisma.community.create({
        data: {
          name: capitalizeProperNoun(shortName || name),
          fullName: capitalizeProperNoun(fullName || name),
          isOnline: !!isOnline,
          state: capitalizeProperNoun(state || 'Unknown'),
          city: capitalizeProperNoun(city || 'Unknown'),
          address: address || '',
          description: description || '',
        },
      });
      communityId = createdCommunity.id;
    }

    if (user.communityId1 === communityId || user.communityId2 === communityId) {
      // noop
    } else if (!user.communityId1) {
      await prisma.user.update({ where: { id: userIdNum }, data: { communityId1: communityId } });
    } else if (!user.communityId2) {
      await prisma.user.update({ where: { id: userIdNum }, data: { communityId2: communityId } });
    }

    if (user.communityRequest) {
      await prisma.userCommunityRequest.delete({ where: { userId: userIdNum } });
    }

    res.json({ message: 'Community created and request approved successfully', communityId });
  } catch (error) {
    const errorDetails = logger.error('createAndApproveCommunityRequest', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      targetUserId: req.body?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to create and approve community request' });
  }
};

export const rejectCommunityRequest = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.body;
    const userIdNum = Number(userId);
    if (!Number.isInteger(userIdNum) || userIdNum <= 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = await prisma.user.findUnique({ where: { id: userIdNum }, include: { communityRequest: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.communityRequest) {
      await prisma.userCommunityRequest.delete({ where: { userId: userIdNum } });
    }
    res.json({ message: 'Community request rejected and cleared' });
  } catch (error) {
    const errorDetails = logger.error('rejectCommunityRequest', error, {
      method: req.method,
      path: req.path,
      userId: req.user?.userId,
      targetUserId: req.body?.userId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to reject community request' });
  }
};

