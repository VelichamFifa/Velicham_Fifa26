import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { LeaderboardEntry } from '../types';
import Leaderboard from '../components/Leaderboard';

type StageTab = 'gr1' | 'gr2' | 'gr3' | 'r32';

const TABS: { key: StageTab; label: string; subtitle: string }[] = [
  { key: 'gr1', label: 'Group Round 11', subtitle: 'Points from GR1' },
  { key: 'gr2', label: 'Group Round 2', subtitle: 'Points from GR2' },
  { key: 'gr3', label: 'Group Round 3', subtitle: 'Points from GR3' },
  { key: 'r32', label: 'Round of 32', subtitle: 'Points from R32' },
];

const StageLeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StageTab>('gr1');
  const [leaderboards, setLeaderboards] = useState<Record<StageTab, LeaderboardEntry[]>>({
    gr1: [],
    gr2: [],
    gr3: [],
    r32: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboards = async () => {
      try {
        setLoading(true); // Keep the main loading state for the initial fetch
        const [gr1Res, gr2Res, gr3Res, r32Res] = await Promise.all([
          apiService.getGR1Leaderboard(100),
          apiService.getGR2Leaderboard(100),
          apiService.getGR3Leaderboard(100),
          apiService.getRound32Leaderboard(100), // This was the old round32 endpoint
        ]);
        setLeaderboards({
          gr1: gr1Res.data?.leaderboard || [],
          gr2: gr2Res.data?.leaderboard || [],
          gr3: gr3Res.data?.leaderboard || [],
          r32: r32Res.data?.leaderboard || [],
        });
      } catch (err) {
        console.error('Failed to load stage leaderboards:', err);
        setError('Could not load stage leaderboards. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboards();
  }, []);

  const activeLeaderboard = leaderboards[activeTab];
  const hasAnyWinners = Object.values(leaderboards).some(lb => lb.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">🏆 Stage Leaderboards</h1>
        <p className="text-white/50 text-sm sm:text-base">
          See who topped the charts during specific stages of the tournament.
        </p>
      </div>

      {/* Tabs */}
      <div className="sm:hidden mb-5">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as StageTab)}
          className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-[#1a2744] focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          {TABS.map((t) => (
            <option key={t.key} value={t.key} className="bg-gray-900 text-white">{t.label}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:flex flex-wrap gap-2 mb-8 border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap -mb-px ${
              activeTab === t.key ? 'border-sky-400 text-sky-400' : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
          <p className="mt-4 text-white/50 text-sm">Loading leaderboards…</p>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-400">{error}</div>
      ) : (
        <div>
          {activeLeaderboard.length > 0 ? (
            <Leaderboard
              entries={activeLeaderboard}
              type="user"
              title={TABS.find(t => t.key === activeTab)?.label || 'Leaderboard'}
              subtitle={TABS.find(t => t.key === activeTab)?.subtitle}
              showCommunityUnderName={true}
              hideState={true}
              hideRank={true}
            />
          ) : hasAnyWinners ? (
            <div className="text-center py-16 text-white/40">
              <p className="text-lg font-medium">No results for this stage yet.</p>
            </div>
          ) : (
            <div className="text-center py-16 text-white/40">
              <p className="text-lg font-medium">No stage leaderboards are available yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StageLeaderboardPage;