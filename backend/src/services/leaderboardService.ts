import { Prediction } from '../models/Prediction';
import { User } from '../models/User';
import { Community } from '../models/Community';
import { CommunityLeader } from '../models/CommunityLeader';

/**
 * Generate community leaderboard with average accuracy and member count
 *
 * SQL logic this implements:
 * SELECT c.Name, AVG(p.Total_Points) as Average_Accuracy, COUNT(u.User_ID) as Member_Count
 * FROM Communities c
 * JOIN Users u ON u.Community_ID = c.ID
 * JOIN Predictions p ON p.Email = u.Email
 * WHERE p.MatchID = :matchId
 * GROUP BY c.ID
 * ORDER BY Average_Accuracy DESC
 */

export const generateCommunityLeaderboard = async (matchId: string) => {
  try {
    const pipeline: any[] = [
      // Stage 1: Filter predictions for the given matchId
      {
        $match: {
          matchId: matchId,
        },
      },

      // Stage 2: Lookup user by Email (Prediction.Email -> User.Email)
      {
        $lookup: {
          from: 'users',
          localField: 'Email',
          foreignField: 'Email',
          as: 'user',
        },
      },
      { $unwind: '$user' },

      // Stage 3: Lookup community by user's Community_ID
      {
        $lookup: {
          from: 'communities',
          localField: 'user.Community_ID',
          foreignField: 'Community_ID',
          as: 'community',
        },
      },
      { $unwind: '$community' },

      // Stage 4: Group by community, calculate average accuracy and member count
      {
        $group: {
          _id: {
            communityId: '$community.Community_ID',
            communityName: '$community.Name',
          },
          Average_Accuracy: { $avg: '$Total_Points' },
          Member_Count: { $sum: 1 },
        },
      },

      // Stage 5: Sort by Average_Accuracy descending
      {
        $sort: { Average_Accuracy: -1 },
      },


      // Stage 7: Project final output format with ranking
      {
        $project: {
          _id: 0,
          communityId: '$_id.communityId',
          Name: '$_id.communityName',
          Average_Accuracy: { $round: ['$Average_Accuracy', 2] },
          Member_Count: 1,
        },
      },
    ];

    const result = await Prediction.aggregate(pipeline);
    return result;
  } catch (error) {
    console.error('Error generating community leaderboard:', error);
    throw error;
  }
};

/**
 * Populate CommunityLeader table after match finalization
 * Deletes existing entries for this matchId and recalculates
 */
export const populateCommunityLeaderTable = async (matchId: string) => {
  try {
    // Get leaderboard data
    const leaderboard = await generateCommunityLeaderboard(matchId);

    if (leaderboard.length === 0) {
      console.log(`No community data found for match ${matchId}`);
      return;
    }

    // Delete existing CommunityLeader entries (full reset for the single election event)
    await CommunityLeader.deleteMany({});

    // Insert new leaderboard entries
    const leadersToInsert = leaderboard.map((item) => ({
      totalPoints: item.Average_Accuracy,
      memberCount: item.Member_Count,
      communityName: item.Name,
      communityId: item.communityId,
    }));

    await CommunityLeader.insertMany(leadersToInsert);

    console.log(`✅ Populated CommunityLeader table with ${leadersToInsert.length} entries for match ${matchId}`);
  } catch (error) {
    console.error('Error populating CommunityLeader table:', error);
    throw error;
  }
};
// export const generateCommunityLeaderboard = async (matchId: string) => {
//   try {
//     const pipeline = [
//       // Stage 1: Filter predictions for the given matchId
//       {
//         $match: {
//           MatchID: matchId
//         }
//       },

//       // Stage 2: Lookup user by Email (Prediction.Email -> User.Email)
//       {
//         $lookup: {
//           from: 'users',
//           localField: 'Email',
//           foreignField: 'Email',
//           as: 'user'
//         }
//       },
//       { $unwind: '$user' },

//       // Stage 3: Lookup community by user's Community_ID -> community ID
//       {
//         $lookup: {
//           from: 'communities',
//           localField: 'user.Community_ID',
//           foreignField: 'ID',
//           as: 'community'
//         }
//       },
//       { $unwind: '$community' },

//       // Stage 4: Group by community, calculate average accuracy and member count
//       {
//         $group: {
//           _id: {
//             communityId: '$community.ID',
//             communityName: '$community.Name'
//           },
//           Average_Accuracy: { $avg: '$Total_Points' },
//           Member_Count: { $sum: 1 }
//         }
//       },

//       // Stage 5: Sort by Average_Accuracy descending
//       {
//         $sort: { Average_Accuracy: -1 }
//       },

//       // Stage 6: Project final output format
//       {
//         $project: {
//           _id: 0,
//           communityId: '$_id.communityId',
//           Name: '$_id.communityName',
//           Average_Accuracy: { $round: ['$Average_Accuracy', 2] },
//           Member_Count: 1
//         }
//       }
//     ];

//     const result = await Prediction.aggregate(pipeline);
//     return result;
//   } catch (error) {
//     console.error('Error generating community leaderboard:', error);
//     throw error;
//   }
// };

/**
 * Generate top individual leaders leaderboard
 * Sort by total points DESC, then by Last_Submitted_Time ASC (earlier submission ranks higher on tie)
 */
export const generateTopLeaders = async (matchId: string) => {
  try {
    const pipeline: any[] = [
      // Stage 1: Filter predictions for the given matchId
      {
        $match: {
          matchId: matchId,
        },
      },

      // Stage 2: Lookup user by Email
      {
        $lookup: {
          from: 'users',
          localField: 'Email',
          foreignField: 'Email',
          as: 'user',
        },
      },
      { $unwind: '$user' },

      // Stage 3: Project final format
      {
        $project: {
          _id: 0,
          email: '$Email',
          firstName: '$user.First_Name',
          lastName: '$user.Last_Name',
          communityId: '$user.Community_ID',
          totalPoints: '$Total_Points',
          lastSubmittedTime: '$Last_Submitted_Time',
        },
      },

      // Stage 4: Sort by points DESC, then by submission time ASC (earlier is better for ties)
      {
        $sort: {
          totalPoints: -1,
          lastSubmittedTime: 1,
        },
      },

    ];

    const result = await Prediction.aggregate(pipeline);

    // Add rank with dense ranking (same points = same rank, but ordered by submission time)
    let lastPoints = -1;
    let rankToAssign = 0;
    const leaderboard = result.map((item, index) => {
      if (item.totalPoints !== lastPoints) {
        rankToAssign = index + 1;
        lastPoints = item.totalPoints;
      }
      return {
        rank: rankToAssign,
        ...item,
      };
    });

    return leaderboard;
  } catch (error) {
    console.error('Error generating top leaders leaderboard:', error);
    throw error;
  }
};
