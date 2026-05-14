import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

type Participant = {
  userId: string;
  email: string;
  name: string;
  state: string;
  communityId1?: string;
  communityId2?: string;
  overallPoints: number;
  dailyPoints: number;
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function stableRanked<T extends { totalPoints: number }>(rows: T[]): Array<T & { rank: number }> {
  return [...rows]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

async function buildParticipants(): Promise<{
  participants: Participant[];
  communityNames: Map<string, string>;
}> {
  const [users, communities] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        state: true,
        communityId1: true,
        communityId2: true,
        finalUserResult: { select: { finalPoint: true } },
      },
      orderBy: { id: 'asc' },
    }),
    prisma.community.findMany({ select: { id: true, name: true }, orderBy: { id: 'asc' } }),
  ]);

  const communityNames = new Map<string, string>(
    communities.map((c) => [String(c.id), c.name])
  );

  if (users.length > 0) {
    const participants = users.map<Participant>((u) => {
      const overallPoints = u.finalUserResult?.finalPoint ?? (60 + ((u.id * 17) % 240));
      const dailyPoints = Math.max(0, Math.floor(overallPoints * 0.35) + ((u.id * 11) % 35));
      return {
        userId: String(u.id),
        email: u.email,
        name: `${u.firstName} ${u.lastName}`.trim(),
        state: u.state || 'Unknown',
        communityId1: u.communityId1 ? String(u.communityId1) : undefined,
        communityId2: u.communityId2 ? String(u.communityId2) : undefined,
        overallPoints,
        dailyPoints,
      };
    });

    return { participants, communityNames };
  }

  // Fallback so mv_* tables are still seeded even when no users exist yet.
  const fallbackCommunityIds = communities.length > 0
    ? communities.map((c) => String(c.id)).slice(0, 4)
    : ['1', '2', '3', '4'];

  const sampleNames = [
    'Alex Carter',
    'Priya Raman',
    'Noah Bennett',
    'Mia Thomas',
    'Liam Foster',
    'Anika Das',
    'Owen Clark',
    'Sofia Khan',
  ];

  const participants = sampleNames.map<Participant>((name, index) => {
    const communityId1 = fallbackCommunityIds[index % fallbackCommunityIds.length];
    const communityId2 = fallbackCommunityIds[(index + 1) % fallbackCommunityIds.length];
    const overallPoints = 80 + ((index + 1) * 19);
    const dailyPoints = 25 + ((index + 1) * 7);
    return {
      userId: String(index + 1001),
      email: `sample${index + 1}@velicham.local`,
      name,
      state: 'Sample',
      communityId1,
      communityId2,
      overallPoints,
      dailyPoints,
    };
  });

  return { participants, communityNames };
}

async function main() {
  console.log('Seeding leaderboard materialized tables...');

  const { participants, communityNames } = await buildParticipants();
  const today = startOfToday();

  const topRows = stableRanked(
    participants.map((p) => ({
      userId: p.userId,
      email: p.email,
      name: p.name,
      state: p.state,
      community1: p.communityId1 ? communityNames.get(p.communityId1) ?? `Community ${p.communityId1}` : null,
      community2: p.communityId2 ? communityNames.get(p.communityId2) ?? `Community ${p.communityId2}` : null,
      totalPoints: p.overallPoints,
    }))
  );

  const dailyRows = stableRanked(
    participants.map((p) => ({
      userId: p.userId,
      email: p.email,
      name: p.name,
      state: p.state,
      community1: p.communityId1 ? communityNames.get(p.communityId1) ?? `Community ${p.communityId1}` : null,
      community2: p.communityId2 ? communityNames.get(p.communityId2) ?? `Community ${p.communityId2}` : null,
      totalPoints: p.dailyPoints,
      date: today,
    }))
  );

  const overallCommunityTotals = new Map<string, number>();
  const dailyCommunityTotals = new Map<string, number>();

  for (const p of participants) {
    for (const cid of [p.communityId1, p.communityId2]) {
      if (!cid) continue;
      overallCommunityTotals.set(cid, (overallCommunityTotals.get(cid) ?? 0) + p.overallPoints);
      dailyCommunityTotals.set(cid, (dailyCommunityTotals.get(cid) ?? 0) + p.dailyPoints);
    }
  }

  const communityRows = stableRanked(
    Array.from(overallCommunityTotals.entries()).map(([communityId, totalPoints]) => ({
      communityId,
      totalPoints,
      communityName: communityNames.get(communityId) ?? `Community ${communityId}`,
    }))
  );

  const dailyCommunityRows = stableRanked(
    Array.from(dailyCommunityTotals.entries()).map(([communityId, totalPoints]) => ({
      communityId,
      totalPoints,
      communityName: communityNames.get(communityId) ?? `Community ${communityId}`,
      date: today,
    }))
  );

  await prisma.$transaction(async (tx) => {
    await tx.topLeader.deleteMany();
    await tx.dailyLeader.deleteMany();
    await tx.communityLeader.deleteMany();
    await tx.dailyCommunityLeader.deleteMany();

    if (topRows.length > 0) {
      await tx.topLeader.createMany({
        data: topRows.map((r) => ({
          rank: r.rank,
          totalPoints: r.totalPoints,
          name: r.name,
          state: r.state,
          community1: r.community1,
          community2: r.community2,
          userId: r.userId,
          email: r.email,
        })),
      });
    }

    if (dailyRows.length > 0) {
      await tx.dailyLeader.createMany({
        data: dailyRows.map((r) => ({
          rank: r.rank,
          totalPoints: r.totalPoints,
          name: r.name,
          state: r.state,
          community1: r.community1,
          community2: r.community2,
          userId: r.userId,
          email: r.email,
          date: r.date,
        })),
      });
    }

    if (communityRows.length > 0) {
      await tx.communityLeader.createMany({
        data: communityRows.map((r) => ({
          rank: r.rank,
          totalPoints: r.totalPoints,
          communityName: r.communityName,
          communityId: r.communityId,
        })),
      });
    }

    if (dailyCommunityRows.length > 0) {
      await tx.dailyCommunityLeader.createMany({
        data: dailyCommunityRows.map((r) => ({
          rank: r.rank,
          totalPoints: r.totalPoints,
          communityName: r.communityName,
          communityId: r.communityId,
          date: r.date,
        })),
      });
    }
  });

  const [topCount, dailyCount, communityCount, dailyCommunityCount] = await Promise.all([
    prisma.topLeader.count(),
    prisma.dailyLeader.count(),
    prisma.communityLeader.count(),
    prisma.dailyCommunityLeader.count(),
  ]);

  console.log(`Seeded mv_top_leaders: ${topCount}`);
  console.log(`Seeded mv_daily_leaders: ${dailyCount}`);
  console.log(`Seeded mv_community_leaders: ${communityCount}`);
  console.log(`Seeded mv_daily_community_leaders: ${dailyCommunityCount}`);
}

main()
  .catch((error) => {
    console.error('Failed to seed leaderboard materialized tables:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
