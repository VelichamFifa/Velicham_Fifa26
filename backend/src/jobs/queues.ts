// Background jobs have been simplified without Redis/BullMQ
// Jobs are now processed synchronously or can be scheduled using node-cron if needed

import { processMatchResults } from '../services/scoringService';
import { generateTopLeaderboard, generateDailyLeaderboard, generateCommunityLeaderboard } from '../services/leaderboardService';

// Score calculation
export const processScoreCalculation = async (matchId: string) => {
  try {
    console.log(`Processing scores for match: ${matchId}`);
    await processMatchResults(matchId);
    console.log(`✓ Score calculation completed for match: ${matchId}`);
    return { success: true, matchId };
  } catch (error) {
    console.error(`Score calculation failed for match ${matchId}:`, error);
    throw error;
  }
};

// Leaderboard generation
export const processLeaderboardGeneration = async (type: 'top' | 'daily' | 'community') => {
  try {
    console.log(`Generating ${type} leaderboard`);

    if (type === 'top') {
      await generateTopLeaderboard(30);
    } else if (type === 'daily') {
      await generateDailyLeaderboard(30);
    } else if (type === 'community') {
      await generateCommunityLeaderboard(30);
    }

    console.log(`✓ ${type} leaderboard generation completed`);
    return { success: true, type };
  } catch (error) {
    console.error(`Leaderboard generation failed for type ${type}:`, error);
    throw error;
  }
};

// Utility function to schedule score calculation (can be called from match controller)
export const scheduleScoreCalculation = async (matchId: string, _delayMs: number = 0) => {
  // Process immediately (or add delay logic if needed with setTimeout)
  return processScoreCalculation(matchId);
};

// Utility function to schedule leaderboard generation (can be called from prediction controller)
export const scheduleLeaderboardGeneration = async (type: 'top' | 'daily' | 'community') => {
  // Process immediately
  return processLeaderboardGeneration(type);
};
