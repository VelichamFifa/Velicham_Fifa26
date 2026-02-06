import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Result, CommunityResult, User } from '../src/models';
import { seedUsers } from './seedData/users';
import {
  generateTopLeaderboard,
  generateDailyLeaderboard,
  generateCommunityLeaderboard,
  generateDailyCommunityLeaderboard,
} from '../src/services/leaderboardService';

dotenv.config();

const results = [
  {
    userId: 'U001',
    userName: 'Avi Nair',
    matchId: 'MATCH001',
    matchTag: 'Group A',
    result: 'win',
    matchPoints: 8,
    finalPoints: 8,
    communityId1: 'Velicham',
    communityId2: 'MMNJ',
    dailyRank: 1,
    finalRank: 2,
  },
  {
    userId: 'U001',
    userName: 'Avi Nair',
    matchId: 'MATCH002',
    matchTag: 'Group C',
    result: 'loss',
    matchPoints: 3,
    finalPoints: 11,
    communityId1: 'Velicham',
    communityId2: 'MMNJ',
  },
  {
    userId: 'U002',
    userName: 'Meera Iyer',
    matchId: 'MATCH001',
    matchTag: 'Group A',
    result: 'draw',
    matchPoints: 6,
    finalPoints: 6,
    communityId1: 'GSO',
    dailyRank: 2,
    finalRank: 4,
  },
  {
    userId: 'U002',
    userName: 'Meera Iyer',
    matchId: 'MATCH003',
    matchTag: 'Group B',
    result: 'win',
    matchPoints: 7,
    finalPoints: 13,
    communityId1: 'GSO',
  },
  {
    userId: 'U003',
    userName: 'Arun Pillai',
    matchId: 'MATCH004',
    matchTag: 'Group D',
    result: 'loss',
    matchPoints: 4,
    finalPoints: 4,
    communityId1: 'NANMA',
    dailyRank: 4,
    finalRank: 6,
  },
  {
    userId: 'U003',
    userName: 'Arun Pillai',
    matchId: 'MATCH005',
    matchTag: 'Group A',
    result: 'win',
    matchPoints: 9,
    finalPoints: 13,
    communityId1: 'NANMA',
  },
  {
    userId: 'U004',
    userName: 'Nisha Menon',
    matchId: 'MATCH006',
    matchTag: 'Group B',
    result: 'draw',
    matchPoints: 5,
    finalPoints: 5,
    communityId1: 'MMNJ',
    dailyRank: 5,
    finalRank: 7,
  },
  {
    userId: 'U004',
    userName: 'Nisha Menon',
    matchId: 'MATCH007',
    matchTag: 'Group C',
    result: 'win',
    matchPoints: 7,
    finalPoints: 12,
    communityId1: 'MMNJ',
  },
  {
    userId: 'U005',
    userName: 'Vikram Shah',
    matchId: 'MATCH008',
    matchTag: 'Group D',
    result: 'win',
    matchPoints: 10,
    finalPoints: 10,
    communityId1: 'Velicham',
    communityId2: 'GSO',
    dailyRank: 1,
    finalRank: 1,
  },
  {
    userId: 'U006',
    userName: 'Anita Varma',
    matchId: 'MATCH003',
    matchTag: 'Group B',
    result: 'loss',
    matchPoints: 2,
    finalPoints: 2,
    communityId1: 'GSO',
    communityId2: 'NANMA',
    dailyRank: 6,
    finalRank: 8,
  },
];

const communityResults = [
  {
    communityId: 'Velicham',
    communityWeightagePoint: 1,
    matchId: 'MATCH001',
    matchTag: 'Group A',
    communityMatchPoint: 12,
    totalCommunityPoint: 12,
    dailyRank: 1,
    finalRank: 1,
  },
  {
    communityId: 'GSO',
    communityWeightagePoint: 1,
    matchId: 'MATCH003',
    matchTag: 'Group B',
    communityMatchPoint: 10,
    totalCommunityPoint: 10,
    dailyRank: 2,
    finalRank: 2,
  },
  {
    communityId: 'NANMA',
    communityWeightagePoint: 1,
    matchId: 'MATCH005',
    matchTag: 'Group A',
    communityMatchPoint: 8,
    totalCommunityPoint: 8,
    dailyRank: 3,
    finalRank: 3,
  },
  {
    communityId: 'MMNJ',
    communityWeightagePoint: 1,
    matchId: 'MATCH007',
    matchTag: 'Group C',
    communityMatchPoint: 7,
    totalCommunityPoint: 7,
    dailyRank: 4,
    finalRank: 4,
  },
];

async function seedLeaderboards() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const bulkOps = seedUsers.map((user) => ({
      updateOne: {
        filter: { userId: user.userId },
        update: { $setOnInsert: user },
        upsert: true,
      },
    }));

    await User.bulkWrite(bulkOps);
    console.log('Ensured seed users exist');

    await Result.deleteMany({});
    await CommunityResult.deleteMany({});
    console.log('Cleared existing results');

    await Result.insertMany(results);
    await CommunityResult.insertMany(communityResults);
    console.log('Seeded results and community results');

    await generateTopLeaderboard(30);
    await generateDailyLeaderboard(30);
    await generateCommunityLeaderboard(30);
    await generateDailyCommunityLeaderboard(30);
    console.log('Generated leaderboard collections');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding leaderboards:', error);
    process.exit(1);
  }
}

seedLeaderboards();
