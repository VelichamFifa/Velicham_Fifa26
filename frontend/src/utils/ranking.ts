/**
 * Applies dense ranking to a pre-sorted (descending) list.
 * Tied entries receive the same rank number.
 * The `pointsKey` parameter specifies which field holds the score (defaults to 'totalPoints').
 */
export function applyDenseRanking<T extends Record<string, any>>(
  list: T[],
  pointsKey: keyof T = 'totalPoints' as keyof T
): (T & { denseRank: number })[] {
  let currentRank = 1;
  let lastPoints: number | null = null;

  return list.map(entry => {
    const pts: number = entry[pointsKey] ?? 0;
    if (lastPoints !== null && pts < lastPoints) currentRank++;
    lastPoints = pts;
    return { ...entry, denseRank: currentRank };
  });
}
