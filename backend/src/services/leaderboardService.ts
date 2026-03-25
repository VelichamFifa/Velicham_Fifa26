import {
  Result,
  CommunityResult,
  TopLeader,
  DailyLeader,
  CommunityLeader,
  DailyCommunityLeader,
  User,
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
        $lookup: {
          from: 'communities',
          localField: 'user.communityId1',
          foreignField: 'communityId',
          as: 'comm1',
        },
      },
      {
        $unwind: {
          path: '$comm1',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'communities',
          localField: 'user.communityId2',
          foreignField: 'communityId',
          as: 'comm2',
        },
      },
      {
        $unwind: {
          path: '$comm2',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          totalPoints: 1,
          name: '$userName',
          email: { $ifNull: ['$user.email', 'unknown@example.com'] },
          state: { $ifNull: ['$user.state', 'Unknown'] },
          community1: { $ifNull: ['$comm1.name', '$user.communityId1'] },
          community2: { $ifNull: ['$comm2.name', '$user.communityId2'] },
        },
      },
    ]);

    // Add rank with Dense Ranking (1, 2, 2, 3...)
    let lastPoints = -1;
    let rankToAssign = 0;
    const leaderboard = results.map((item) => {
      if (item.totalPoints !== lastPoints) {
        rankToAssign++;
        lastPoints = item.totalPoints;
      }
      return {
        rank: rankToAssign,
        ...item,
      };
    });

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
        $lookup: {
          from: 'communities',
          localField: 'user.communityId1',
          foreignField: 'communityId',
          as: 'comm1',
        },
      },
      {
        $unwind: {
          path: '$comm1',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'communities',
          localField: 'user.communityId2',
          foreignField: 'communityId',
          as: 'comm2',
        },
      },
      {
        $unwind: {
          path: '$comm2',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          totalPoints: 1,
          name: '$userName',
          email: { $ifNull: ['$user.email', 'unknown@example.com'] },
          state: { $ifNull: ['$user.state', 'Unknown'] },
          community1: { $ifNull: ['$comm1.name', '$user.communityId1'] },
          community2: { $ifNull: ['$comm2.name', '$user.communityId2'] },
        },
      },
    ]);

    // Add rank with Dense Ranking
    let lastPoints = -1;
    let rankToAssign = 0;
    const leaderboard = results.map((item) => {
      if (item.totalPoints !== lastPoints) {
        rankToAssign++;
        lastPoints = item.totalPoints;
      }
      return {
        rank: rankToAssign,
        date: today,
        ...item,
      };
    });

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

    // Add rank with Dense Ranking
    let lastPoints = -1;
    let rankToAssign = 0;
    const leaderboard = results.map((item) => {
      if (item.totalPoints !== lastPoints) {
        rankToAssign++;
        lastPoints = item.totalPoints;
      }
      return {
        rank: rankToAssign,
        ...item,
      };
    });

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

    // Add rank with Dense Ranking
    let lastPoints = -1;
    let rankToAssign = 0;
    const leaderboard = results.map((item) => {
      if (item.totalPoints !== lastPoints) {
        rankToAssign++;
        lastPoints = item.totalPoints;
      }
      return {
        rank: rankToAssign,
        date: targetDate,
        ...item,
      };
    });

    await DailyCommunityLeader.deleteMany({ date: { $gte: targetDate } });
    await DailyCommunityLeader.insertMany(leaderboard);

    return leaderboard;
  } catch (error) {
    console.error('Error generating daily community leaderboard:', error);
    return [];
  }
};

export const generateMatchLeaderboard = async (matchId: string) => {
  try {
    const results = await Result.find({ matchId }).sort({ matchPoints: -1 });

    if (results.length === 0) return [];

    // Add rank with Dense Ranking
    let lastPoints = -1;
    let rankToAssign = 0;
    const leaderboard = results.map((item: any) => {
      if (item.matchPoints !== lastPoints) {
        rankToAssign++;
        lastPoints = item.matchPoints;
      }
      return {
        userId: item.userId,
        rank: rankToAssign,
        matchPoints: item.matchPoints
      };
    });

    return leaderboard;
  } catch (error) {
    console.error(`Error generating match leaderboard for ${matchId}:`, error);
    return [];
  }
};

export const generateCommunityUserRanking = async (communityId: string, isDaily: boolean = false, limit: number = 50) => {
  try {

    // --- Step 1: Get userIds in the community (early filter) ---
    let userIdFilter: string[] | null = null;
    if (communityId !== 'global') {
      const communityUsers = await User.find(
        { $or: [{ communityId1: communityId }, { communityId2: communityId }] },
        { userId: 1, _id: 0 }
      ).lean();

      if (communityUsers.length === 0) return [];
      userIdFilter = communityUsers.map((u: any) => u.userId);
    }

    // --- Step 2: Build the match stage (date + userId filter applied early) ---
    const matchStage: any = {};
    if (isDaily) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchStage.createdAt = { $gte: today };
    }
    if (userIdFilter) {
      matchStage.userId = { $in: userIdFilter };
    }

    // --- Step 3: Aggregate only pre-filtered results ---
    const pipeline: any[] = [
      { $match: matchStage },
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
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          name: '$userName',
          totalPoints: 1,
          state: { $ifNull: ['$user.state', ''] },
        }
      },
    ];

    const results = await Result.aggregate(pipeline);

    // --- Step 4: Apply Dense Ranking ---
    let lastPoints = -1;
    let rankToAssign = 0;
    const leaderboard = results.map((item) => {
      if (item.totalPoints !== lastPoints) {
        rankToAssign++;
        lastPoints = item.totalPoints;
      }
      return { ...item, rank: rankToAssign };
    });

    return leaderboard;
  } catch (error) {
    console.error('Error in generateCommunityUserRanking:', error);
    return [];
  }
};
