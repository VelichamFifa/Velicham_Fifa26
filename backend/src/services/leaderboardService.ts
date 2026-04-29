import {
  Result,
  CommunityResult,
  TopLeader,
  DailyLeader,
  CommunityLeader,
  DailyCommunityLeader,
} from '../models';

export const generateTopLeaderboard = async (limit: number = 30) => {
  try {

    const results = await Result.aggregate([
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$matchPoints' },
          userName: { $first: '$userName' },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'userId',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          totalPoints: 1,
          name: '$userName',
          email: '$user.email',
          state: '$user.state',
          community1: '$user.communityId1',
          community2: '$user.communityId2',
        },
      },
    ]);

    // Add rank
    const leaderboard = results.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    // Update TopLeader collection
    await TopLeader.deleteMany({});
    await TopLeader.insertMany(leaderboard);

    return leaderboard;
  } catch (error) {
    console.error('Error generating top leaderboard:', error);
    return [];
  }
};

export const generateDailyLeaderboard = async (limit: number = 30) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const results = await Result.aggregate([
      {
        $match: {
          createdAt: { $gte: today },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalPoints: { $sum: '$matchPoints' },
          userName: { $first: '$userName' },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'userId',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          totalPoints: 1,
          name: '$userName',
          email: '$user.email',
          state: '$user.state',
          community1: '$user.communityId1',
          community2: '$user.communityId2',
        },
      },
    ]);

    const leaderboard = results.map((item, index) => ({
      rank: index + 1,
      date: today,
      ...item,
    }));

    // Update DailyLeader collection
    await DailyLeader.deleteMany({ date: { $gte: today } });
    await DailyLeader.insertMany(leaderboard);

    return leaderboard;
  } catch (error) {
    console.error('Error generating daily leaderboard:', error);
    return [];
  }
};

export const generateCommunityLeaderboard = async (limit: number = 30) => {
  try {

    const results = await CommunityResult.aggregate([
      {
        $group: {
          _id: '$communityId',
          totalPoints: { $sum: '$communityMatchPoint' },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'communities',
          localField: '_id',
          foreignField: 'communityId',
          as: 'community',
        },
      },
      {
        $unwind: {
          path: '$community',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          communityId: '$_id',
          communityName: '$community.name',
          totalPoints: 1,
        },
      },
    ]);

    const leaderboard = results.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    // Update CommunityLeader collection
    await CommunityLeader.deleteMany({});
    await CommunityLeader.insertMany(leaderboard);

    return leaderboard;
  } catch (error) {
    console.error('Error generating community leaderboard:', error);
    return [];
  }
};

export const generateDailyCommunityLeaderboard = async (limit: number = 30, date?: Date) => {
  try {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const results = await CommunityResult.aggregate([
      {
        $match: {
          createdAt: { $gte: targetDate },
        },
      },
      {
        $group: {
          _id: '$communityId',
          totalPoints: { $sum: '$communityMatchPoint' },
        },
      },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'communities',
          localField: '_id',
          foreignField: 'communityId',
          as: 'community',
        },
      },
      {
        $unwind: {
          path: '$community',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          communityId: '$_id',
          communityName: '$community.name',
          totalPoints: 1,
        },
      },
    ]);

    const leaderboard = results.map((item, index) => ({
      rank: index + 1,
      date: targetDate,
      ...item,
    }));

    await DailyCommunityLeader.deleteMany({ date: { $gte: targetDate } });
    await DailyCommunityLeader.insertMany(leaderboard);

    return leaderboard;
  } catch (error) {
    console.error('Error generating daily community leaderboard:', error);
    return [];
  }
};

export const invalidateLeaderboardCache = async () => {
  try {
    // Cache invalidation no longer needed - using direct database queries
    console.log('✓ Leaderboard data refreshed from database');
  } catch (error) {
    console.error('Error refreshing leaderboard:', error);
  }
};
