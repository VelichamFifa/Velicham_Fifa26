import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

type MatchSeed = {
  sequence: number;
  team1: string;
  team2: string;
  round: string;
  group: string;
  offsetHours: number;
};

const groups: Record<string, [string, string, string, string]> = {
  A: ['MEX', 'RSA', 'KOR', 'CZE'],
  B: ['CAN', 'BIH', 'QAT', 'SUI'],
  C: ['BRA', 'MAR', 'HAI', 'SCO'],
  D: ['USA', 'PAR', 'AUS', 'TUR'],
  E: ['GER', 'CUW', 'CIV', 'ECU'],
  F: ['NED', 'JPN', 'SWE', 'TUN'],
  G: ['BEL', 'EGY', 'IRN', 'NZL'],
  H: ['ESP', 'CPV', 'KSA', 'URU'],
  I: ['FRA', 'SEN', 'IRQ', 'NOR'],
  J: ['ARG', 'ALG', 'AUT', 'JOR'],
  K: ['POR', 'COD', 'UZB', 'COL'],
  L: ['ENG', 'CRO', 'GHA', 'PAN'],
};

function buildGroupStageFixtures(): MatchSeed[] {
  const fixtures: MatchSeed[] = [];
  const groupOrder = Object.keys(groups);
  let sequence = 1;
  let offsetHours = 24;

  for (const group of groupOrder) {
    const [t1, t2, t3, t4] = groups[group];

    // Matchday 1: 1 vs 2, 3 vs 4
    fixtures.push({ sequence: sequence++, team1: t1, team2: t2, round: 'Group Stage', group, offsetHours });
    offsetHours += 6;
    fixtures.push({ sequence: sequence++, team1: t3, team2: t4, round: 'Group Stage', group, offsetHours });
    offsetHours += 6;

    // Matchday 2: 1 vs 3, 4 vs 2
    fixtures.push({ sequence: sequence++, team1: t1, team2: t3, round: 'Group Stage', group, offsetHours });
    offsetHours += 6;
    fixtures.push({ sequence: sequence++, team1: t4, team2: t2, round: 'Group Stage', group, offsetHours });
    offsetHours += 6;

    // Matchday 3: 4 vs 1, 2 vs 3
    fixtures.push({ sequence: sequence++, team1: t4, team2: t1, round: 'Group Stage', group, offsetHours });
    offsetHours += 6;
    fixtures.push({ sequence: sequence++, team1: t2, team2: t3, round: 'Group Stage', group, offsetHours });
    offsetHours += 6;
  }

  return fixtures;
}

const fixtures: MatchSeed[] = buildGroupStageFixtures();

function addHours(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  console.log('Seeding matches...');

  const teamIds = new Set((await prisma.team.findMany({ select: { teamId: true } })).map((t) => t.teamId));
  for (const fixture of fixtures) {
    if (!teamIds.has(fixture.team1) || !teamIds.has(fixture.team2)) {
      throw new Error(`Missing team reference in fixture #${fixture.team1}_${fixture.team2}: ${fixture.team1} vs ${fixture.team2}`);
    }
  }

  await prisma.$transaction([
    prisma.prediction.deleteMany(),
    prisma.result.deleteMany(),
    prisma.communityResult.deleteMany(),
    prisma.match.deleteMany(),
  ]);

  const base = new Date();
  const matches = fixtures.map((f) => {
    const matchTime = addHours(base, f.offsetHours);
    const predictionsEndingTime = addHours(matchTime, -1);
    return {
      sequence: f.sequence,
      team1: f.team1,
      team2: f.team2,
      matchTime,
      predictionsEndingTime,
      round: f.round,
      group: f.group,
      matchTag: `#${f.team1}_${f.team2}`,
      status: 'OnBoarded' as const,
      comment: null,
      team1Score: null,
      team2Score: null,
    };
  });

  await prisma.match.createMany({ data: matches });

  const count = await prisma.match.count();
  console.log(`Matches seeded: ${count}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed matches:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
