import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';
import { LeaderboardEntry, CommunityLeaderboardEntry } from '../types';
import Leaderboard from '../components/Leaderboard';

const LeaderboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'top' | 'daily' | 'community' | 'daily-community'>('top');
  const [topLeaderboard, setTopLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyLeaderboard, setDailyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [communityLeaderboard, setCommunityLeaderboard] = useState<CommunityLeaderboardEntry[]>([]);
  const [dailyCommunityLeaderboard, setDailyCommunityLeaderboard] = useState<CommunityLeaderboardEntry[]>([]);
  const [lastMatchTag, setLastMatchTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);

      const [topRes, dailyRes, communityRes, dailyCommunityRes, lastMatchRes] = await Promise.all([
        apiService.getTopLeaderboard(500),
        apiService.getDailyLeaderboard(500),
        apiService.getCommunityLeaderboard(100),
        apiService.getDailyCommunityLeaderboard(100),
        apiService.getLatestCompletedMatch().catch(() => null),
      ]);

      setTopLeaderboard(topRes.data.leaderboard || []);
      setDailyLeaderboard(dailyRes.data.leaderboard || []);
      setCommunityLeaderboard(communityRes.data.leaderboard || []);
      setDailyCommunityLeaderboard(dailyCommunityRes.data.leaderboard || []);
      if (lastMatchRes?.data?.matchTag) setLastMatchTag(lastMatchRes.data.matchTag);
    } catch (error) {
      console.error('Failed to load leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'top', label: '🏆 Top Leaders' },
    { key: 'community', label: '👥 Communities' },
    { key: 'daily', label: '🏆 Last Match Leaders' },
    { key: 'daily-community', label: '👥 Last Match Community Leaders' },
  ] as const;

  const filteredTopLeaderboard = topLeaderboard.filter(
    (entry) => entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredDailyLeaderboard = dailyLeaderboard.filter(
    (entry) => entry.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredCommunityLeaderboard = communityLeaderboard.filter(
    (entry) => entry.communityName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredDailyCommunityLeaderboard = dailyCommunityLeaderboard.filter(
    (entry) => entry.communityName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showSearch = activeTab === 'top' || activeTab === 'daily' || activeTab === 'community' || activeTab === 'daily-community';

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8">Leaderboards</h1>

      {/* Mobile: dropdown */}
      <div className="sm:hidden mb-5">
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as typeof activeTab)}
          className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-[#1a2744] focus:outline-none focus:ring-2 focus:ring-secondary"
        >
          {tabs.map((t) => (
            <option key={t.key} value={t.key} className="bg-gray-900 text-white">{t.label}</option>
          ))}
        </select>
      </div>

      {/* Desktop: tab bar */}
      <div className="hidden sm:flex gap-2 mb-8 border-b border-white/10">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === t.key
                ? 'border-secondary text-secondary'
                : 'border-transparent text-white/60 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showSearch && (
        <div className="mb-6 relative">
          <input
            type="text"
            placeholder={`Search in ${tabs.find(t => t.key === activeTab)?.label || 'leaderboard'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-80 bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60 shadow-lg"
          />
          <svg className="absolute left-4 top-3.5 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
          <p className="mt-4 text-gray-600">Loading leaderboards...</p>
        </div>
      ) : (
        <>
          {activeTab === 'top' && (
            <Leaderboard
              entries={filteredTopLeaderboard}
              type="user"
              title="All-Time Top Leaders"
              showCommunityUnderName={true}
              hideState={true}
            />
          )}
          {activeTab === 'daily' && (
            <>
              <Leaderboard
                entries={filteredDailyLeaderboard}
                type="user"
                title="Last Match Leaders"
                subtitle={lastMatchTag ?? undefined}
                showCommunityUnderName={true}
                hideState={true}
              />
            </>
          )}
          {activeTab === 'community' && (
            <Leaderboard
              entries={filteredCommunityLeaderboard}
              type="community"
              title="Community Rankings"
            />
          )}
          {activeTab === 'daily-community' && (
            <>
              <Leaderboard
                entries={filteredDailyCommunityLeaderboard}
                type="community"
                title="Last Match Community Leaders"
                subtitle={lastMatchTag ?? undefined}
                disableNavigation={true}
              />
            </>
          )}
        </>
      )}

    </div>
  );
};

export default LeaderboardPage;
