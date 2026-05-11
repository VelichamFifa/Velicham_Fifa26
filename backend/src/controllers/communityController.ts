import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getCommunities = async (req: Request, res: Response) => {
  try {
    const communities = await prisma.community.findMany({
      select: { communityId: true, name: true, fullName: true, state: true, city: true, isOnline: true },
      orderBy: { name: 'asc' },
    });
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
};

export const getCommunityById = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const community = await prisma.community.findUnique({ where: { communityId } });
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch community' });
  }
};
