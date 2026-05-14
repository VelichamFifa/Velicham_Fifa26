import { prisma } from '../lib/prisma';

interface ScoringCriteria {
  correctResult: number;
  correctTeam1Score: number;
  correctTeam2Score: number;
  correctGoalDifference: number;
}

const SCORING: ScoringCriteria = {
  correctResult: 5,
  correctTeam1Score: 2,
  correctTeam2Score: 2,
  correctGoalDifference: 1,
};

export const calculatePredictionPoints = (
  predictedTeam1: number,
  predictedTeam2: number,
  actualTeam1: number,
  actualTeam2: number
): number => {
  let points = 0;

  const predictedDiff = predictedTeam1 - predictedTeam2;
  const actualDiff = actualTeam1 - actualTeam2;

  if (
    (predictedDiff > 0 && actualDiff > 0) ||
    (predictedDiff < 0 && actualDiff < 0) ||
    (predictedDiff === 0 && actualDiff === 0)
  ) {
    points += SCORING.correctResult;
  }

  if (predictedTeam1 === actualTeam1) points += SCORING.correctTeam1Score;
  if (predictedTeam2 === actualTeam2) points += SCORING.correctTeam2Score;
  if (Math.abs(predictedDiff) === Math.abs(actualDiff)) points += SCORING.correctGoalDifference;

  return points;
};

export const processMatchResults = async (matchId: number) => {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || match.status !== 'completed') {
    throw new Error('Match not found or not completed');
  }
  if (match.team1Score === null || match.team2Score === null) {
    throw new Error('Match scores not set');
  }

  const communityNameCache = new Map<number, string>();

  const getCommunityName = async (communityId: number | null | undefined): Promise<string | null> => {
    if (!communityId) return null;
    if (communityNameCache.has(communityId)) {
      return communityNameCache.get(communityId)!;
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: { name: true },
    });

    const resolved = community?.name ?? String(communityId);
    communityNameCache.set(communityId, resolved);
    return resolved;
  };

  const predictions = await prisma.prediction.findMany({ where: { matchId } });
  const communityPointsMap = new Map<string, number>();

  for (const prediction of predictions) {
    const points = calculatePredictionPoints(
      prediction.team1Score,
      prediction.team2Score,
      match.team1Score,
      match.team2Score
    );

    await prisma.prediction.update({
      where: { id: prediction.id },
      data: { points },
    });

    const predictedDiff = prediction.team1Score - prediction.team2Score;
    const actualDiff = match.team1Score - match.team2Score;

    let result: 'win' | 'loss' | 'draw' = 'loss';
    if ((predictedDiff > 0 && actualDiff > 0) || (predictedDiff < 0 && actualDiff < 0)) result = 'win';
    else if (predictedDiff === 0 && actualDiff === 0) result = 'draw';

    const user = await prisma.user.findUnique({ where: { id: prediction.userId } });
    if (!user) continue;

    const [communityName1, communityName2] = await Promise.all([
      getCommunityName(user.communityId1),
      getCommunityName(user.communityId2),
    ]);

    await prisma.result.upsert({
      where: { userId_matchId: { userId: prediction.userId, matchId } },
      create: {
        userId: prediction.userId,
        matchId,
        matchTag: prediction.matchTag,
        result,
        matchPoints: points,
        finalPoints: points,
        communityName1,
        communityName2,
      },
      update: {
        matchTag: prediction.matchTag,
        result,
        matchPoints: points,
        finalPoints: points,
        communityName1,
        communityName2,
      },
    });

    if (user.communityId1) {
      const cid1 = String(user.communityId1);
      communityPointsMap.set(cid1, (communityPointsMap.get(cid1) || 0) + points);
    }
    if (user.communityId2 && user.communityId2 !== user.communityId1) {
      const cid2 = String(user.communityId2);
      communityPointsMap.set(cid2, (communityPointsMap.get(cid2) || 0) + points);
    }
  }

  for (const [communityId, communityMatchPoint] of communityPointsMap) {
    await prisma.communityResult.upsert({
      where: { communityId_matchId: { communityId, matchId } },
      create: {
        communityId,
        matchId,
        matchTag: match.matchTag,
        communityMatchPoint,
      },
      update: {
        matchTag: match.matchTag,
        communityMatchPoint,
      },
    });
  }
};

