import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLoadTestData() {
  console.log('🚀 Starting load test data generation...');

  // ⚠️ REPLACE THESE WITH VALID IDs FROM YOUR DATABASE
  const targetMatchId = 90; 
  const community1Id = 2; 
  const matchTag = 'LoadTestMatch';
  const predictionCount = 100000; // Number of predictions to create

  try {
    // 1. Create 1000 Dummy Users
    console.log(`Generating ${predictionCount} dummy users...`);
    const usersToCreate: Prisma.UserCreateManyInput[] = [];
    for (let i = 0; i < predictionCount; i++) {
      usersToCreate.push({
        email: `loaduser${i}@example.com`,
        firstName: `Load`,
        lastName: `User ${i}`,
        city: 'Load City',
        state: 'TS',
        country: 'USA',
        communityId1: community1Id,
        isActive: true,
        status: 'active'
      });
    }

    // Bulk insert users
    await prisma.user.createMany({
      data: usersToCreate,
      skipDuplicates: true, // Prevents crashing if you run the script multiple times
    });
    console.log('✅ Successfully inserted users.');

    // Fetch the inserted users to get their generated IDs
    const users = await prisma.user.findMany({
      where: {
        email: { startsWith: 'loaduser' },
      },
      select: { id: true },
    });

    // 2. Create 1000 Dummy Predictions
    console.log(`Generating dummy predictions for Match: ${targetMatchId}...`);
    const predictionsToCreate: Prisma.PredictionCreateManyInput[] = [];
    for (const user of users) {
      predictionsToCreate.push({
        userId: user.id,
        matchId: targetMatchId,
        matchTag: matchTag,
        team1Score: Math.floor(Math.random() * 5), // Random score 0-4
        team2Score: Math.floor(Math.random() * 5), // Random score 0-4
        submittedTime: new Date(),
        points: 0,
      });
    }

    // Bulk insert predictions
    await prisma.prediction.createMany({
      data: predictionsToCreate,
      skipDuplicates: true,
    });
    console.log(`✅ Successfully inserted ${predictionsToCreate.length} predictions.`);

    console.log('🎉 Load test data generation completed successfully!');
  } catch (error) {
    console.error('❌ Error generating load test data:', error);
  }
}

seedLoadTestData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });