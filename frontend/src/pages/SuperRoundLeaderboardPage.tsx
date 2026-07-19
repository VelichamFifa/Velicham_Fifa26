import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { LeaderboardEntry } from '../types';
import Leaderboard from '../components/Leaderboard';

const SuperRoundLeaderboardPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await apiService.getSuperRoundLeaderboard(150);
        setLeaderboard(res.data?.leaderboard || []);
      } catch (err) {
        console.error('Failed to load Super Round leaderboard:', err);
        setError('Could not load the Super Round leaderboard. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter((entry) =>
    entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">🏆 Super Round Leaderboard</h1>
        <p className="text-white/50 text-sm sm:text-base">
          Combined points from R16, Quarter, Semi, Third Place, and Final.
        </p>
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-80 bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60 shadow-lg"
        />
        <svg className="absolute left-4 top-3.5 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
          <p className="mt-4 text-white/50 text-sm">Loading leaderboard...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">{error}</div>
      ) : (
        <div>
          {filteredLeaderboard.length > 0 ? (
            <Leaderboard
              entries={filteredLeaderboard}
              type="user"
              title="Super Round Leaderboard"
              subtitle="R16 + Quarter + Semi + Third + Final"
              showCommunityUnderName={true}
              hideState={true}
              hideRank={true}
            />
          ) : leaderboard.length > 0 && filteredLeaderboard.length === 0 ? (
            <div className="text-center py-16 text-white/40">
              <p className="text-lg font-medium">No members found matching your search.</p>
            </div>
          ) : (
            <div className="text-center py-16 text-white/40">
              <p className="text-lg font-medium">No Super Round results yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuperRoundLeaderboardPage;
