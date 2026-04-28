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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLeaderboards();
  }, []);

  const loadLeaderboards = async () => {
    try {
      setLoading(true);

      const [topRes, dailyRes, communityRes, dailyCommunityRes] = await Promise.all([
        apiService.getTopLeaderboard(30),
        apiService.getDailyLeaderboard(30),
        apiService.getCommunityLeaderboard(30),
        apiService.getDailyCommunityLeaderboard(30),
      ]);

      setTopLeaderboard(topRes.data.leaderboard || []);
      setDailyLeaderboard(dailyRes.data.leaderboard || []);
      setCommunityLeaderboard(communityRes.data.leaderboard || []);
      setDailyCommunityLeaderboard(dailyCommunityRes.data.leaderboard || []);
    } catch (error) {
      console.error('Failed to load leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-6 sm:mb-8">Leaderboards</h1>

      <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab('top')}
          className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'top'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🏆 Top Leaders
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'daily'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📅 Daily Leaders
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'community'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          👥 Communities
        </button>
        <button
          onClick={() => setActiveTab('daily-community')}
          className={`px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-medium border-b-2 transition whitespace-nowrap ${
            activeTab === 'daily-community'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          🗓️ Daily Communities
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
          <p className="mt-4 text-gray-600">Loading leaderboards...</p>
        </div>
      ) : (
        <>
          {activeTab === 'top' && (
            <Leaderboard
              entries={topLeaderboard}
              type="user"
              title="All-Time Top Leaders"
            />
          )}
          {activeTab === 'daily' && (
            <Leaderboard
              entries={dailyLeaderboard}
              type="user"
              title="Today's Leaders"
            />
          )}
          {activeTab === 'community' && (
            <Leaderboard
              entries={communityLeaderboard}
              type="community"
              title="Community Rankings"
            />
          )}
          {activeTab === 'daily-community' && (
            <Leaderboard
              entries={dailyCommunityLeaderboard}
              type="community"
              title="Today's Community Leaders"
            />
          )}
        </>
      )}

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-primary mb-2">📊 Scoring Rules</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>✅ Correct Result: 5 points</li>
          <li>⚽ Correct Team 1 Score: 2 points</li>
          <li>⚽ Correct Team 2 Score: 2 points</li>
          <li>🎯 Correct Goal Difference: 1 point</li>
        </ul>
      </div>
    </div>
  );
};

export default LeaderboardPage;
