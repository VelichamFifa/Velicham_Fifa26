import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Match, Prediction } from '../types';
import MatchCard from '../components/MatchCard';

const Home: React.FC = () => {
  const { isLoggedIn, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const getPredictionMatchId = (prediction: Prediction): string => {
    if (typeof prediction.matchId === 'string') return prediction.matchId;
    if (typeof (prediction.matchId as any) === 'number') return String(prediction.matchId);
    return (prediction.matchId as Match).matchId;
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    const load = async () => {
      try {
        setLoadingMatches(true);
        const [matchesRes, predictionsRes] = await Promise.all([
          apiService.getAllMatches('scheduled', 1, 50),
          apiService.getUserPredictions(1, 100),
        ]);
        setMatches(matchesRes.data.matches);
        setUserPredictions(predictionsRes.data.predictions);
      } catch (err) {
        console.error('Failed to load matches:', err);
      } finally {
        setLoadingMatches(false);
      }
    };
    load();
  }, [isLoggedIn]);

  const displayMatches = useMemo(() => {
    const active = matches.filter((m) => {
      const s = String(m.status || '').trim().toLowerCase();
      return s === 'scheduled' || s === 'ongoing';
    });
    const sort = (list: Match[]) =>
      [...list].sort((a, b) => new Date(a.matchTime).getTime() - new Date(b.matchTime).getTime());
    return active.length > 0 ? sort(active) : sort(matches);
  }, [matches]);

  const handlePredictionSubmit = (matchId: string, team1Score: number, team2Score: number) => {
    const submittedTime = new Date().toISOString();
    setUserPredictions((prev) => {
      const idx = prev.findIndex((p) => getPredictionMatchId(p) === matchId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], matchId, team1Score, team2Score, submittedTime };
        return next;
      }
      const optimistic: Prediction = {
        _id: `optimistic-${matchId}`,
        userId: user?.userId || '',
        matchId,
        matchTag: '',
        team1Score,
        team2Score,
        submittedTime,
        points: 0,
      };
      return [optimistic, ...prev];
    });
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">🏆 Velicham Fifa'26 Prediction</h1>
          <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-6 sm:mb-8 px-4">
            Get ready to participate, compete and celebrate with your community!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link
                to="/leaderboard"
                className="px-6 sm:px-8 py-3 bg-white text-primary font-bold rounded-lg hover:bg-blue-50 transition text-center inline-flex items-center justify-center gap-2"
              >
                <span aria-hidden="true">🏅</span>
                View Leaderboard
              </Link>
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="px-6 sm:px-8 py-3 bg-secondary text-white font-bold rounded-lg hover:bg-blue-600 transition text-center"
                >
                  Login to Predict
                </Link>
              )}
                {isLoggedIn && (
                  <Link
                    to="/dashboard"
                    className="px-6 sm:px-8 py-3 bg-secondary text-white font-bold rounded-lg hover:bg-blue-600 transition text-center inline-flex items-center justify-center gap-2"
                  >
                    <span aria-hidden="true">📊</span>
                    View Dashboard
                  </Link>
                )}
            </div>
        </div>

        {/* Match Prediction Tiles — shown only when logged in */}
        {isLoggedIn && (
          <div className="mb-12 sm:mb-16">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">⚽ Matches to Predict</h2>
              <Link to="/dashboard" className="text-sm text-sky-400 hover:text-white transition font-medium">
                Full Dashboard →
              </Link>
            </div>
            {loadingMatches ? (
              <div className="text-center py-10">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-secondary"></div>
                <p className="mt-3 text-white/50 text-sm">Loading matches…</p>
              </div>
            ) : displayMatches.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {displayMatches.map((match) => {
                  const userPrediction = userPredictions.find(
                    (p) => getPredictionMatchId(p) === match.matchId
                  );
                  return (
                    <MatchCard
                      key={match.matchId}
                      match={match}
                      userPrediction={userPrediction}
                      onPredictionSubmit={handlePredictionSubmit}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-white/50">No matches scheduled yet</div>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="bg-white/10 border border-white/15 rounded-lg shadow-lg p-6 hover:bg-white/15 transition">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">⚽ Make Predictions</h3>
            <p className="text-white/70">
              Predict the scores of upcoming FIFA matches before the deadline and earn points based on accuracy.
            </p>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-lg shadow-lg p-6 hover:bg-white/15 transition">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">🏅 Climb Leaderboards</h3>
            <p className="text-white/70">
              Compete individually and with your community. Track daily and all-time rankings.
            </p>
          </div>

          <div className="bg-white/10 border border-white/15 rounded-lg shadow-lg p-6 hover:bg-white/15 transition">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">👥 Join Communities</h3>
            <p className="text-white/70">
              Be part of up to 2 communities and help them climb the community leaderboard.
            </p>
          </div>
        </div>

        {/* Scoring Rules */}
        <div className="bg-white/10 border border-white/15 rounded-xl shadow-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-bold text-white mb-3">📊 Scoring Rules</h3>
          <ul className="text-sm text-white/80 space-y-2">
            <li className="flex items-center gap-2">✅ <span><strong>Correct Result:</strong> 5 points</span></li>
            <li className="flex items-center gap-2">⚽ <span><strong>Correct Team 1 Score:</strong> 2 points</span></li>
            <li className="flex items-center gap-2">⚽ <span><strong>Correct Team 2 Score:</strong> 2 points</span></li>
            <li className="flex items-center gap-2">🎯 <span><strong>Correct Goal Difference:</strong> 1 point</span></li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Home;
