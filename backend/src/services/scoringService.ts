import { Match, Prediction, Result, User, CommunityResult } from '../models';

interface ScoringCriteria {
  correctResult: number; // 5 points
  correctTeam1Score: number; // 2 points
  correctTeam2Score: number; // 2 points
  correctGoalDifference: number; // 1 point
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

  // Check correct result (win/loss/draw)
  const predictedDiff = predictedTeam1 - predictedTeam2;
  const actualDiff = actualTeam1 - actualTeam2;

  if (
    (predictedDiff > 0 && actualDiff > 0) ||
    (predictedDiff < 0 && actualDiff < 0) ||
    (predictedDiff === 0 && actualDiff === 0)
  ) {
    points += SCORING.correctResult;
  }

  // Check correct Team1 score
  if (predictedTeam1 === actualTeam1) {
    points += SCORING.correctTeam1Score;
  }

  // Check correct Team2 score
  if (predictedTeam2 === actualTeam2) {
    points += SCORING.correctTeam2Score;
  }

  // Check correct goal difference
  if (Math.abs(predictedDiff) === Math.abs(actualDiff)) {
    points += SCORING.correctGoalDifference;
  }

  return points;
};

export const processMatchResults = async (matchId: string) => {
  try {
    const match = await Match.findOne({ matchId });

    if (!match || match.status !== 'completed') {
      throw new Error('Match not found or not completed');
    }

    if (match.team1Score === undefined || match.team2Score === undefined) {
      throw new Error('Match scores not set');
    }

    const predictions = await Prediction.find({ matchId });
    const communityPointsMap = new Map<string, number>();

    for (const prediction of predictions) {
      const points = calculatePredictionPoints(
        prediction.team1Score,
        prediction.team2Score,
        match.team1Score,
        match.team2Score
      );

      prediction.points = points;
      await prediction.save();

      // Determine result
      const predictedDiff = prediction.team1Score - prediction.team2Score;
      const actualDiff = match.team1Score - match.team2Score;

      let result: 'win' | 'loss' | 'draw' = 'loss';
      if (
        (predictedDiff > 0 && actualDiff > 0) ||
        (predictedDiff < 0 && actualDiff < 0)
      ) {
        result = 'win';
      } else if (predictedDiff === 0 && actualDiff === 0) {
        result = 'draw';
      }

      const user = await User.findOne({ userId: prediction.userId });

      if (user) {
        await Result.findOneAndUpdate(
          { userId: prediction.userId, matchId },
          {
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
          { upsert: true, new: true }
        );

        // Accumulate points for Community 1
        if (user.communityId1) {
          const current = communityPointsMap.get(user.communityId1) || 0;
          communityPointsMap.set(user.communityId1, current + points);
        }

        // Accumulate points for Community 2 (only if it's different from Community 1)
        if (user.communityId2 && user.communityId2 !== user.communityId1) {
          const current = communityPointsMap.get(user.communityId2) || 0;
          communityPointsMap.set(user.communityId2, current + points);
        }
      }
    }

    console.log(`✓ Processed ${predictions.length} predictions for match ${matchId}`);
    console.log(`📊 Community Points to save:`, Object.fromEntries(communityPointsMap));

    // Update CommunityResult for each community that had members playing
    for (const [communityId, communityPoints] of communityPointsMap) {
      try {
        await CommunityResult.findOneAndUpdate(
          { communityId, matchId },
          {
            communityId,
            matchId,
            matchTag: match.matchTag,
            communityMatchPoint: communityPoints,
          },
          { upsert: true, new: true }
        );
      } catch (saveError) {
        console.error(`✗ Failed to save CommunityResult for ${communityId}:`, saveError);
      }
    }

    console.log(`✓ Processed results for match ${matchId}`);
  } catch (error) {
    console.error(`✗ Error processing results for match ${matchId}:`, error);
  }
};
