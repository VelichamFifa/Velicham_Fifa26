import { Request, Response } from 'express';
import { Community } from '../models/Community';
import { User } from '../models/User';

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

    const communities = await Community.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'users',
          localField: 'Community_ID',
          foreignField: 'Community_ID',
          as: 'members'
        }
      },
      {
        $addFields: {
          Member_Count: { $size: '$members' }
        }
      },
      {
        $project: {
          _id: 0,
          Community_ID: 1,
          Name: 1,
          City: 1,
          State: 1,
          President_Name: 1,
          Member_Count: 1
        }
      },
      { $sort: { Name: 1 } }
    ]);

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

export const getCommunityMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { communityId } = req.params;
    const members = await User.find({ Community_ID: communityId.toString() })
      .select('First_Name Last_Name Email -_id')
      .sort({ First_Name: 1 });

    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
