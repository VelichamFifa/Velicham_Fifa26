import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { useLocation } from 'react-router-dom';
import { LeaderboardEntry } from '../types';
import Leaderboard from '../components/Leaderboard';

type StageTab = 'gr1' | 'gr2' | 'gr3';

const TABS: { key: StageTab; label: string; subtitle: string }[] = [
  { key: 'gr1', label: 'Group Round 1', subtitle: '' },
  { key: 'gr2', label: 'Group Round 2', subtitle: '' },
  { key: 'gr3', label: 'Group Round 3', subtitle: '' },
];

const GroupLeaderboardPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = (queryParams.get('stage') as StageTab) || 'gr1';

  const [activeTab, setActiveTab] = useState<StageTab>(TABS.some(t => t.key === initialTab) ? initialTab : 'gr1');
  const [leaderboards, setLeaderboards] = useState<Record<StageTab, LeaderboardEntry[]>>({
    gr1: [],
    gr2: [],
    gr3: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLeaderboards = async () => {
      try {
        setLoading(true); // Keep the main loading state for the initial fetch
        const [gr1Res, gr2Res, gr3Res] = await Promise.all([
          apiService.getGR1Leaderboard(100),
          apiService.getGR2Leaderboard(100),
          apiService.getGR3Leaderboard(100),
        ]);
        setLeaderboards({
          gr1: gr1Res.data?.leaderboard || [],
          gr2: gr2Res.data?.leaderboard || [],
          gr3: gr3Res.data?.leaderboard || [],
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

  const activeLeaderboard = leaderboards[activeTab].filter(
    (entry) => entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const hasAnyWinners = Object.values(leaderboards).some(lb => lb.length > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">🏆 Group Stage Leaderboards</h1>
        <p className="text-white/50 text-sm sm:text-base">
          See who topped the charts during the group stages.
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

      {/* Tabs */}
      <div className="flex overflow-x-auto sm:flex-wrap gap-2 mb-8 border-b border-white/10 hide-scrollbar">
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

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

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

export default GroupLeaderboardPage;