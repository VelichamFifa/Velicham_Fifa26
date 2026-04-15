import { Match } from '../models/Match';
import { Prediction } from '../models/Prediction';
import { CommunityLeader } from '../models/CommunityLeader';
import { connectDB, disconnectDB } from '../config/database';

async function resetMatch(matchId: string) {
  try {
    console.log(`🚀 Starting reset for match ${matchId}...`);
    await connectDB();

    // 1. Reset the match status and official results
    const match = await Match.findOneAndUpdate(
      { matchId },
      {
        IsFinalized: false,
        $unset: {
          official_UDF: 1,
          official_LDF: 1,
          official_NDA: 1
        }
      },
      { new: true }
    );

    if (!match) {
      console.error(`❌ Match ${matchId} not found.`);
    } else {
      console.log(`✅ Match ${matchId} status reset to incomplete.`);
    }

    // 2. Reset points for all predictions of this match
    const predictionReset = await Prediction.updateMany(
      { matchId },
      { $set: { Total_Points: null } }
    );
    console.log(`✅ Reset points for ${predictionReset.modifiedCount} predictions.`);

    // 3. Clear the community leaderboard table
    // (Since we usually recalculate everything on finalize, clearing ensures no stale data)
    await CommunityLeader.deleteMany({});
    console.log('✅ Cleared CommunityLeader table.');

    console.log('🎉 Reset complete!');
  } catch (error) {
    console.error('❌ Error during reset:', error);
  } finally {
    await disconnectDB();
  }
}

// Run the script for match '1'
const targetMatchId = process.argv[2] || '1';
resetMatch(targetMatchId);
