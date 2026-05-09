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

export const processMatchResults = async (matchId: string) => {
  const match = await prisma.match.findUnique({ where: { matchId } });
  if (!match || match.status !== 'completed') {
    throw new Error('Match not found or not completed');
  }
  if (match.team1Score === null || match.team2Score === null) {
    throw new Error('Match scores not set');
  }

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

    const user = await prisma.user.findUnique({ where: { userId: prediction.userId } });
    if (!user) continue;

    await prisma.result.upsert({
      where: { userId_matchId: { userId: prediction.userId, matchId } },
      create: {
        userId: prediction.userId,
        userName: `${user.firstName} ${user.lastName}`,
        matchId,
        matchTag: prediction.matchTag,
        result,
        matchPoints: points,
        finalPoints: points,
        communityId1: user.communityId1,
        communityId2: user.communityId2,
      },
      update: {
        userName: `${user.firstName} ${user.lastName}`,
        matchTag: prediction.matchTag,
        result,
        matchPoints: points,
        finalPoints: points,
        communityId1: user.communityId1,
        communityId2: user.communityId2,
      },
    });

    if (user.communityId1) {
      communityPointsMap.set(user.communityId1, (communityPointsMap.get(user.communityId1) || 0) + points);
    }
    if (user.communityId2 && user.communityId2 !== user.communityId1) {
      communityPointsMap.set(user.communityId2, (communityPointsMap.get(user.communityId2) || 0) + points);
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

