import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Match } from '../src/models';

dotenv.config();

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
  {
    matchId: 'MATCH003',
    sequence: 3,
    team1: 'MEX',
    team2: 'ECU',
    matchTime: new Date('2026-06-22T19:00:00Z'),
    predictionsEndingTime: new Date('2026-06-22T17:00:00Z'),
    round: 1,
    matchTag: 'Group B',
    status: 'scheduled',
  },
  {
    matchId: 'MATCH004',
    sequence: 4,
    team1: 'URY',
    team2: 'BOL',
    matchTime: new Date('2026-06-22T22:00:00Z'),
    predictionsEndingTime: new Date('2026-06-22T20:00:00Z'),
    round: 1,
    matchTag: 'Group D',
    status: 'scheduled',
  },
  {
    matchId: 'MATCH005',
    sequence: 5,
    team1: 'CHI',
    team2: 'CAN',
    matchTime: new Date('2026-06-23T18:00:00Z'),
    predictionsEndingTime: new Date('2026-06-23T16:00:00Z'),
    round: 1,
    matchTag: 'Group A',
    status: 'scheduled',
  },
  {
    matchId: 'MATCH006',
    sequence: 6,
    team1: 'VEN',
    team2: 'JAM',
    matchTime: new Date('2026-06-23T21:00:00Z'),
    predictionsEndingTime: new Date('2026-06-23T19:00:00Z'),
    round: 1,
    matchTag: 'Group B',
    status: 'scheduled',
  },
  {
    matchId: 'MATCH007',
    sequence: 7,
    team1: 'PAR',
    team2: 'CRC',
    matchTime: new Date('2026-06-24T18:00:00Z'),
    predictionsEndingTime: new Date('2026-06-24T16:00:00Z'),
    round: 1,
    matchTag: 'Group C',
    status: 'scheduled',
  },
  {
    matchId: 'MATCH008',
    sequence: 8,
    team1: 'USA',
    team2: 'PAN',
    matchTime: new Date('2026-06-24T21:00:00Z'),
    predictionsEndingTime: new Date('2026-06-24T19:00:00Z'),
    round: 1,
    matchTag: 'Group D',
    status: 'scheduled',
  },
];

async function seedMatches() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing matches
    await Match.deleteMany({});
    console.log('Cleared existing matches');

    // Insert new matches
    const result = await Match.insertMany(matches);
    console.log(`Successfully seeded ${result.length} matches:`);
    result.forEach((match) => {
      console.log(
        `  - Match ${match.sequence}: ${match.team1} vs ${match.team2} (${match.matchTag}) - ${match.matchTime.toISOString()}`
      );
    });

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding matches:', error);
    process.exit(1);
  }
}

seedMatches();
