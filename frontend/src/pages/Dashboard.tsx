import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Match, Prediction } from '../types';
import MatchCard from '../components/MatchCard';

import RankingDrillDown from '../components/RankingDrillDown';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);

  // Drill-down state
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownConfig, setDrillDownConfig] = useState({
    communityId: 'global',
    isDaily: false,
    title: 'Overall Ranking',
  });

  interface UserRankInfo {
    rank: string | number;
    totalPoints: number;
  }

  interface CommunityStat {
    communityId: string;
    name: string;
    overall: UserRankInfo;
    daily: UserRankInfo;
  }

  interface UserStats {
    overall: UserRankInfo;
    daily: UserRankInfo;
    communities: CommunityStat[];
  }

  const [userStats, setUserStats] = useState<UserStats>({
    overall: { rank: '-', totalPoints: 0 },
    daily: { rank: '-', totalPoints: 0 },
    communities: [],
  });

  const getPredictionMatchId = (prediction: Prediction): string =>
    typeof prediction.matchId === 'string' ? prediction.matchId : prediction.matchId.matchId;

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    loadDashboardData();
  }, [isLoggedIn, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [matchesRes, predictionsRes, statsRes] = await Promise.all([
        apiService.getAllMatches(undefined, 1, 50), // fetch more to ensure we get upcoming days
        apiService.getUserPredictions(1, 100),
        apiService.getUserStats(),
      ]);

      setMatches(matchesRes.data.matches);
      setUserPredictions(predictionsRes.data.predictions);
      setUserStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = (communityId: string, isDaily: boolean, title: string) => {
    setDrillDownConfig({ communityId, isDaily, title });
    setShowDrillDown(true);
  };

  const handlePredictionSubmit = (matchId: string, team1Score: number, team2Score: number) => {
    const submittedTime = new Date().toISOString();

    setUserPredictions((prev) => {
      const existingIndex = prev.findIndex((p) => getPredictionMatchId(p) === matchId);
      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          matchId,
          team1Score,
          team2Score,
          submittedTime,
        };
        return next;
      }

      const optimisticPrediction: Prediction = {
        _id: `optimistic-${matchId}`,
        userId: user?.userId || '',
        matchId,
        matchTag: '',
        team1Score,
        team2Score,
        submittedTime,
        points: 0,
      };
      return [optimisticPrediction, ...prev];
    });

    // Refresh ranking data in the background without triggering the page-level loading state.
    void apiService
      .getUserStats()
      .then((statsRes) => setUserStats(statsRes.data))
      .catch(() => undefined);
  };

  const displayMatches = useMemo(() => {
    // Show all scheduled/ongoing matches with resilient status handling.
    const activeMatches = matches.filter((m) => {
      const normalizedStatus = String(m.status || '').trim().toLowerCase();
      return normalizedStatus === 'scheduled' || normalizedStatus === 'ongoing';
    });

    const toSorted = (list: Match[]) =>
      [...list].sort((a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime());

    // Fallback to all matches if upstream status values are inconsistent.
    return activeMatches.length > 0 ? toSorted(activeMatches) : toSorted(matches);
  }, [matches]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">Welcome, {user?.firstName}!</h1>
        <p className="text-sm sm:text-base text-gray-600">Make predictions on upcoming matches and climb the leaderboard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content: Matches to Predict */}
        <div className="lg:col-span-2">
          {/* Leaderboard Highlights Banner */}
          <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4">Matches to Predict</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
              <p className="mt-4 text-sm sm:text-base text-gray-600">Loading matches...</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {displayMatches.length > 0 ? (
                displayMatches.map((match) => {
                  const userPrediction = userPredictions.find((p) => getPredictionMatchId(p) === match.matchId);
                  return (
                    <MatchCard
                      key={match.matchId}
                      match={match}
                      userPrediction={userPrediction}
                      onPredictionSubmit={handlePredictionSubmit}
                    />
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12 text-gray-600">
                  No matches scheduled yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div
            onClick={() => navigate('/my-predictions')}
            className="bg-white p-4 rounded-lg shadow cursor-pointer hover:bg-gray-50 transition border-2 border-transparent hover:border-secondary flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {/* History Document+Clock SVG icon */}
              <svg className="w-6 h-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="6" />
                <path d="M8 5v3h2" />
                <path d="M13.5 3H18a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-5.5" />
                <path d="M15 10h2" />
                <path d="M9 15h8" />
                <path d="M9 19h8" />
              </svg>
              <h3 className="text-gray-700 text-sm font-bold uppercase tracking-wide">History</h3>
            </div>
            <span className="text-[10px] text-secondary font-bold flex items-center gap-1 group uppercase">
              VIEW ALL
              <svg className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </div>
          <div
            className="bg-white p-4 rounded-lg shadow border-2 border-transparent overflow-hidden"
          >
            <div className="mb-3">
              <h3 className="text-gray-600 text-[11px] uppercase font-bold tracking-wider">My Communities</h3>
            </div>

            <div className="space-y-2">
              {userStats.communities.map((comm) => (
                <div key={comm.communityId} className="rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2">
                  <p className="text-[9px] text-gray-500 uppercase font-black tracking-wider mb-2">{comm.name}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDrillDown(comm.communityId, false, `${comm.name} — Overall`)}
                      className="flex-1 flex items-center justify-between bg-white border border-secondary/20 rounded-lg px-2.5 py-1.5 hover:bg-secondary/5 hover:border-secondary/50 transition-all group/chip"
                    >
                      <span className="text-[8px] font-black text-gray-400 uppercase group-hover/chip:text-secondary transition-colors">Overall</span>
                      <span className="text-sm font-black text-secondary">
                        {comm.overall.rank === '-' ? '–' : `#${comm.overall.rank}`}
                      </span>
                    </button>
                    <button
                      onClick={() => handleDrillDown(comm.communityId, true, `${comm.name} — Daily`)}
                      className="flex-1 flex items-center justify-between bg-white border border-primary/20 rounded-lg px-2.5 py-1.5 hover:bg-primary/5 hover:border-primary/50 transition-all group/chip"
                    >
                      <span className="text-[8px] font-black text-gray-400 uppercase group-hover/chip:text-primary transition-colors">Daily</span>
                      <span className="text-sm font-black text-primary">
                        {comm.daily.rank === '-' ? '–' : `#${comm.daily.rank}`}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <RankingDrillDown
        isOpen={showDrillDown}
        onClose={() => setShowDrillDown(false)}
        communityId={drillDownConfig.communityId}
        isDaily={drillDownConfig.isDaily}
        title={drillDownConfig.title}
        currentUserId={user?.userId}
      />
    </div>
  );
};

export default Dashboard;
