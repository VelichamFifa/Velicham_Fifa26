export interface ScoreResult {
  points: number;
  details: {
    winnerCorrect: boolean;
    runnerUpCorrect: boolean;
    thirdPlaceCorrect: boolean;
    udfSeatCorrect: boolean;
    ldfSeatCorrect: boolean;
    ndaSeatCorrect: boolean;
  };
}

export const calculatePoints = (
  userUDF: number,
  userLDF: number,
  userNDA: number,
  officialUDF: number,
  officialLDF: number,
  officialNDA: number
): number => {
  let points = 0;

  // 1. Result Check (Win/Draw)
  // Only check for UDF-LDF draw, ignore NDA
  const getOutcome = (udf: number, ldf: number, nda: number) => {
    // Check if UDF and LDF are tied (regardless of NDA)
    if (udf === ldf) {
      return 'DRAW-UDF-LDF';
    }

    // Single winner
    if (udf > ldf && udf > nda) return 'WIN-UDF';
    if (ldf > udf && ldf > nda) return 'WIN-LDF';
    if (nda > udf && nda > ldf) return 'WIN-NDA';

    // Fallback (should not reach here in normal cases)
    return 'UNKNOWN';
  };

  const userOutcome = getOutcome(userUDF, userLDF, userNDA);
  const officialOutcome = getOutcome(officialUDF, officialLDF, officialNDA);

  if (userOutcome === officialOutcome) {
    points += 5;
  }

  // 2. Exact Seats Checks (+5 each for exact matches)
  if (userUDF === officialUDF) points += 5;
  if (userLDF === officialLDF) points += 5;
  if (userNDA === officialNDA) points += 5;

  return points;
};
