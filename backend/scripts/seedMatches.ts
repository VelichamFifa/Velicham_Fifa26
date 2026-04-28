import dotenv from 'dotenv';
import { prisma } from '../src/lib/prisma';

dotenv.config();

// Minimal sample matches (keep your real schedule seeding separate if needed)
const matches = [
  {
    matchId: 'MATCH001',
    sequence: 1,
    team1: 'ARG',
    team2: 'PER',
    matchTime: new Date('2026-06-21T20:00:00Z'),
    predictionsEndingTime: new Date('2026-06-21T18:00:00Z'),
    round: 1,
    matchTag: 'Group A',
    status: 'scheduled',
  },
  {
    matchId: 'MATCH002',
    sequence: 2,
    team1: 'BRA',
    team2: 'COL',
    matchTime: new Date('2026-06-21T23:00:00Z'),
    predictionsEndingTime: new Date('2026-06-21T21:00:00Z'),
    round: 1,
    matchTag: 'Group C',
    status: 'scheduled',
  },
];

async function seedMatches() {
  try {
    await prisma.$connect();
    console.log('Connected to SQL Server');

    await prisma.communityResult.deleteMany();
    await prisma.prediction.deleteMany();
    await prisma.result.deleteMany();
    await prisma.match.deleteMany();
    console.log('Cleared existing matches and related rows');

    const result = await prisma.match.createMany({ data: matches });
    console.log(`Successfully seeded ${result.count} matches:`);
    matches.forEach((m) => console.log(`  - ${m.matchId}: ${m.team1} vs ${m.team2}`));

    await prisma.$disconnect();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding matches:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedMatches();

