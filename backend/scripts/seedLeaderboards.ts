import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma';

dotenv.config();

async function seedCommunityLeaderboards() {
  try {
    await prisma.$connect();
    console.log('Connected to database');

    const communities = await prisma.community.findMany({
      orderBy: { communityId: 'asc' },
      select: { communityId: true, name: true },
    });

    if (communities.length === 0) {
      console.log('No communities found. Run seed:communities first.');
      await prisma.$disconnect();
      process.exit(0);
    }

    await prisma.dailyCommunityLeader.deleteMany();
    await prisma.communityLeader.deleteMany();
    console.log('Cleared existing community leaderboard rows');

    const overallRows = communities.map((community, index) => ({
      rank: index + 1,
      totalPoints: (communities.length - index) * 50,
      communityName: community.name,
      communityId: community.communityId,
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyRows = communities.map((community, index) => ({
      rank: index + 1,
      totalPoints: (communities.length - index) * 12,
      communityName: community.name,
      communityId: community.communityId,
      date: today,
    }));

    const overallResult = await prisma.communityLeader.createMany({ data: overallRows });
    const dailyResult = await prisma.dailyCommunityLeader.createMany({ data: dailyRows });

    console.log(`Seeded ${overallResult.count} rows into mv_community_leaders`);
    console.log(`Seeded ${dailyResult.count} rows into mv_daily_community_leaders`);

    overallRows.forEach((row) => {
      console.log(`  #${row.rank} ${row.communityName} (${row.communityId}) - ${row.totalPoints} pts`);
    });

    await prisma.$disconnect();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding community leaderboards:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedCommunityLeaderboards();
