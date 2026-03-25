import { Request, Response } from 'express';
import { Community } from '../models';

export const getCommunities = async (req: Request, res: Response) => {
  try {
    const communities = await Community.find().select('communityId name fullName state city').sort('name');
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
};

export const getCommunityById = async (req: Request, res: Response) => {
  try {
    const { communityId } = req.params;
    const community = await Community.findOne({ communityId });
    
    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }
    
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch community' });
  }
};
