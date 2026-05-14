import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export const getCommunities = async (req: Request, res: Response) => {
  try {
    const communities = await prisma.community.findMany({
      select: { id: true, name: true, fullName: true, state: true, city: true, isOnline: true },
      orderBy: { name: 'asc' },
    });
    res.json(
      communities.map((c) => ({
        communityId: String(c.id),
        name: c.name,
        fullName: c.fullName,
        state: c.state,
        city: c.city,
        isOnline: c.isOnline,
      }))
    );
  } catch (error) {
    const errorDetails = logger.error('getCommunities', error, {
      method: req.method,
      path: req.path,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch communities' });
  }
};

export const getCommunityById = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const id = Number(communityId);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid community id' });
    }
    const community = await prisma.community.findUnique({ where: { id } });
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    
    res.json({
      ...community,
      communityId: String(community.id),
    });
  } catch (error) {
    const errorDetails = logger.error('getCommunityById', error, {
      method: req.method,
      path: req.path,
      communityId: req.params.communityId,
    });
    res.status(errorDetails.statusCode || 500).json({ error: 'Failed to fetch community' });
  }
};
