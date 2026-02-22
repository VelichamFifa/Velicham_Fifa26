import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Match } from '../types';
import MatchCard from '../components/MatchCard';
import PredictionForm from '../components/PredictionForm';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showPredictionForm, setShowPredictionForm] = useState(false);
  const [predictionCount, setPredictionCount] = useState(0);
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
    overall: { rank: 'N/A', totalPoints: 0 },
    daily: { rank: 'N/A', totalPoints: 0 },
    communities: [],
  });

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
        apiService.getAllMatches(undefined, 1, 20),
        apiService.getUserPredictions(1, 1),
        apiService.getUserStats(),
      ]);

      setMatches(matchesRes.data.matches);
      setPredictionCount(predictionsRes.data.pagination.total);
      setUserStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePredictClick = (match: Match) => {
    setSelectedMatch(match);
    setShowPredictionForm(true);
  };

  const handlePredictionSuccess = () => {
    setShowPredictionForm(false);
    setSelectedMatch(null);
    loadDashboardData();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-2">Welcome, {user?.firstName}!</h1>
        <p className="text-sm sm:text-base text-gray-600">Make predictions on upcoming matches and climb the leaderboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 sm:mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-600 text-sm font-medium mb-1">Active Matches</h3>
          <p className="text-3xl font-bold text-secondary">{matches.filter(m => m.status === 'scheduled').length}</p>
        </div>
        <div
          onClick={() => navigate('/my-predictions')}
          className="bg-white p-6 rounded-lg shadow cursor-pointer hover:bg-gray-50 transition border-2 border-transparent hover:border-secondary"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-gray-600 text-sm font-medium mb-1">My Predictions</h3>
            <span className="text-xs text-secondary font-bold">VIEW ALL →</span>
          </div>
          <p className="text-3xl font-bold text-secondary">{predictionCount}</p>
        </div>
        <div
          onClick={() => navigate('/leaderboard')}
          className="bg-white p-4 rounded-lg shadow cursor-pointer hover:bg-gray-50 transition border-2 border-transparent hover:border-secondary overflow-hidden"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-gray-600 text-[11px] uppercase font-bold tracking-wider">My Rankings</h3>
            <span className="text-[10px] text-secondary font-bold">VIEW BOARD →</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-gray-50 rounded p-2 flex flex-col items-center justify-center border-l-4 border-secondary">
              <span className="text-[9px] text-gray-500 uppercase font-bold">Overall</span>
              <span className="text-xl font-black text-secondary">#{userStats.overall.rank}</span>
            </div>
            <div className="bg-gray-50 rounded p-2 flex flex-col items-center justify-center border-l-4 border-primary">
              <span className="text-[9px] text-gray-500 uppercase font-bold">Daily</span>
              <span className="text-xl font-black text-primary">#{userStats.daily.rank}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {userStats.communities.map((comm) => (
              <div key={comm.communityId} className="bg-white border border-gray-100 rounded p-1.5">
                <div className="text-[9px] text-gray-400 font-bold truncate mb-1">{comm.name}</div>
                <div className="flex justify-between items-center px-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[8px] text-gray-400 uppercase">Overall</span>
                    <span className="text-xs font-bold text-secondary">#{comm.overall.rank}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[8px] text-gray-400 uppercase">Daily</span>
                    <span className="text-xs font-bold text-primary">#{comm.daily.rank}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4">Upcoming Matches</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600">Loading matches...</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.length > 0 ? (
              matches.map((match) => (
                <MatchCard
                  key={match._id}
                  match={match}
                  onPredictClick={handlePredictClick}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-gray-600">
                No matches scheduled yet
              </div>
            )}
          </div>
        )}
      </div>

      {showPredictionForm && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <PredictionForm
            match={selectedMatch}
            onSuccess={handlePredictionSuccess}
            onClose={() => setShowPredictionForm(false)}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
