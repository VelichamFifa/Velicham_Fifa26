import { Request, Response } from 'express';
import { Community } from '../models/Community';

export const getCommunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, state, city } = req.query;
    let query: Record<string, unknown> = {};

    if (search) {
      query.$or = [
        { Name: { $regex: search as string, $options: 'i' } },
        { City: { $regex: search as string, $options: 'i' } },
        { President_Name: { $regex: search as string, $options: 'i' } }
      ];
    }

    if (state) {
      query.State = { $regex: state as string, $options: 'i' };
    }

    if (city) {
      query.City = { $regex: city as string, $options: 'i' };
    }

    const communities = await Community.find(query)
      .select('Community_ID Name President_Name -_id')
      .sort({ Name: 1 });

    res.json(communities);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getCommunityById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { communityId } = req.params;
    const community = await Community.findOne({ Community_ID: communityId.toString() });
    if (!community) {
      res.status(404).json({
        message: 'Community not found'
      });
      return;
    }

    res.json(community);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
