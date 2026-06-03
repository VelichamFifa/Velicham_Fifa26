import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Match, Prediction } from '../types';
import MatchCard from '../components/MatchCard';

const Home: React.FC = () => {
  const { isLoggedIn, user, logout } = useAuth();
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
      <div className="relative w-full overflow-hidden shadow-2xl border-b border-white/10 bg-primary">
        <img src="/Cover.png" alt="WORLD CUP 2026 Cover" className="w-full h-auto object-cover max-h-[400px] sm:max-h-[600px] block" />
        
        {/* Bottom-to-top gradient to blend the image into the page background */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-black/10" />

        <div className="absolute inset-0 flex flex-col justify-between pt-4 pb-2 pl-4 sm:pt-10 sm:pb-4 sm:pl-8">
          {isLoggedIn && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-20">
              <button
                onClick={() => logout()}
                className="p-2.5 bg-white/5 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white rounded-xl transition-all duration-200 flex items-center gap-2 text-xs font-bold backdrop-blur-sm shadow-xl"
                title="Logout"
              >
                <span className="hidden sm:inline uppercase tracking-wider">Logout</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <img src="/VelichamLogo.png" alt="Velicham Logo" className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-left-12 duration-1000" />
              <img src="/Mlogo-w.png" alt="Media One Logo" className="h-12 sm:h-16 md:h-20 w-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-right-12 duration-1000" />
            </div>
            <h1 className="text-white font-bold text-sm sm:text-xl md:text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <span className="block text-white">WORLD CUP '26</span>
              <span className="block text-sky-400">Prediction</span>
            </h1>
          </div>
          <p className="text-xs sm:text-base md:text-lg text-sky-100/80 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            Get ready to participate, compete and celebrate with your community!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">

        <div className="text-center mb-6 sm:mb-8">
          <div className="flex flex-row gap-3 justify-center px-4">
              <Link
                to="/leaderboard"
                className="w-40 py-2.5 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-lg shadow-sky-500/20 text-sm"
              >
                View Leaderboard
              </Link>
              {isLoggedIn && (
                <Link
                  to="/dashboard"
                  className="w-40 py-2.5 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center gap-2 tracking-wide shadow-lg shadow-sky-500/20 text-sm"
                >
                  <span aria-hidden="true">📊</span>
                  Dashboard
                </Link>
              )}
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="w-40 py-2.5 bg-gradient-to-r from-blue-600 to-sky-400 text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 text-center inline-flex items-center justify-center tracking-wide shadow-lg shadow-sky-500/20 text-sm"
                >
                  Login to Predict
                </Link>
              )}
            </div>
        </div>

        {/* Match Prediction Tiles — shown only when logged in */}
        {isLoggedIn && (
          <div className="mb-12 sm:mb-16">
            <div className="flex items-center mb-4">
              <h2 className="text-base sm:text-lg font-bold text-white">⚽ Matches to Predict</h2>
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

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 p-6 shadow-2xl transition-all duration-300 hover:border-white/20 hover:shadow-blue-900/30 group"
            style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 group-hover:text-sky-400 transition-colors">
                <span className="text-2xl">⚽</span> Make Predictions
              </h3>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                Predict the scores of upcoming WORLD CUP matches before the deadline and earn points based on accuracy.
              </p>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 p-6 shadow-2xl transition-all duration-300 hover:border-white/20 hover:shadow-blue-900/30 group"
            style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 group-hover:text-sky-400 transition-colors">
                <span className="text-2xl">🏅</span> Climb Leaderboards
              </h3>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                Compete individually and with your community. Track daily and all-time rankings.
              </p>
            </div>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 p-6 shadow-2xl transition-all duration-300 hover:border-white/20 hover:shadow-blue-900/30 group"
            style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
          >
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%)',
              }}
            />
            <div className="relative z-10">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 flex items-center gap-2 group-hover:text-sky-400 transition-colors">
                <span className="text-2xl">👥</span> Join Communities
              </h3>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                Be part of up to 2 communities and help them climb the community leaderboard.
              </p>
            </div>
          </div>
        </div>

        {/* Scoring Rules */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 p-6 max-w-md mx-auto shadow-2xl"
          style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white mb-3 border-b border-white/10 pb-2">📊 Scoring Rules</h3>
            <ul className="text-sm text-white/70 space-y-3">
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/20 text-green-400 text-[10px] border border-green-500/20 font-bold">5</span>
                <span><strong>Correct Result:</strong> 5 points</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] border border-blue-500/20 font-bold">2</span>
                <span><strong>Correct Team 1 Score:</strong> 2 points</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-[10px] border border-blue-500/20 font-bold">2</span>
                <span><strong>Correct Team 2 Score:</strong> 2 points</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 text-[10px] border border-sky-500/20 font-bold">1</span>
                <span><strong>Correct Goal Difference:</strong> 1 point</span>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
