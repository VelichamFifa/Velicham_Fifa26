import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { LeaderboardEntry } from '../types';
import Leaderboard from '../components/Leaderboard';

const Round32LeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await apiService.getRound32Leaderboard(100);
        setLeaderboard(res.data?.leaderboard || []);
      } catch (err) {
        console.error('Failed to load Round of 32 leaderboard:', err);
        setError('Could not load the leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">🏆 Round of 32 Leaderboard</h1>
        <p className="text-white/50 text-sm sm:text-base">
          See who topped the charts during the Round of 32.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
          <p className="mt-4 text-white/50 text-sm">Loading leaderboard…</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">{error}</div>
      ) : (
        <div>
          {leaderboard.length > 0 ? (
            <Leaderboard
              entries={leaderboard}
              type="user"
              title="Round of 32"
              subtitle="Points from the R32 stage"
              showCommunityUnderName={true}
              hideState={true}
              hideRank={true}
            />
          ) : (
            <div className="text-center py-16 text-white/40">
              <p className="text-lg font-medium">No results for this stage yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Round32LeaderboardPage;