import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { Match, Prediction } from '../types';
import MatchCard from '../components/MatchCard';



const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPredictions, setUserPredictions] = useState<Prediction[]>([]);
  const [activeScoringPopup, setActiveScoringPopup] = useState<'knockout' | 'community' | null>(null);



  interface UserRankInfo {
    rank: string | number;
    totalPoints: number;
    lastMatchTag?: string | null;
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
    final: UserRankInfo;
    communities: CommunityStat[];
  }

  const [userStats, setUserStats] = useState<UserStats>({
    overall: { rank: '-', totalPoints: 0 },
    daily: { rank: '-', totalPoints: 0, lastMatchTag: null },
    final: { rank: '-', totalPoints: 0 },
    communities: [],
  });

  const getPredictionMatchId = (prediction: Prediction): string => {
    if (typeof prediction.matchId === 'string') return prediction.matchId;
    if (typeof (prediction.matchId as any) === 'number') return String(prediction.matchId);
    return (prediction.matchId as Match).matchId;
  };

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // Redirect to profile setup if any of the mandatory location fields are missing
    if (user && (
      !user.city || user.city === 'Not Set' ||
      !user.state || user.state === 'Not Set' ||
      !user.country || user.country === 'Not Set'
    )) {
      navigate('/profile-setup');
      return;
    }

    loadDashboardData();
  }, [isLoggedIn, user, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [matchesRes, predictionsRes, statsRes] = await Promise.all([
        apiService.getAllMatches('scheduled', 1, 50), // only show scheduled matches for predictions
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

  const handlePredictionSubmit = (
    matchId: string,
    team1Score: number,
    team2Score: number,
    penaltyShootoutWinner?: string
  ) => {
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
          penaltyShootoutWinner: penaltyShootoutWinner || null,
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
        penaltyShootoutWinner: penaltyShootoutWinner || null,
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
      <div className="mb-2 sm:mb-3">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Welcome, {user?.firstName}!</h1>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm sm:text-base text-white/60">Make predictions on upcoming matches and climb the leaderboard</p>
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveScoringPopup((prev) => (prev === 'knockout' ? null : 'knockout'))}
                className="inline-flex items-center rounded-full border border-amber-300/45 bg-amber-400/20 px-3 py-1.5 text-xs font-bold tracking-wide text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]"
                aria-label="Knockout points guidance"
                aria-expanded={activeScoringPopup === 'knockout'}
                aria-controls="rule-change-popup"
              >
                <span>Knockout points</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveScoringPopup((prev) => (prev === 'community' ? null : 'community'))}
                className="inline-flex items-center rounded-full border border-amber-300/45 bg-amber-400/20 px-3 py-1.5 text-xs font-bold tracking-wide text-amber-100 shadow-[0_0_0_1px_rgba(251,191,36,0.12)]"
                aria-label="Community weightage point guidance"
                aria-expanded={activeScoringPopup === 'community'}
                aria-controls="rule-change-popup"
              >
                <span>Community Weightage Point</span>
              </button>
            </div>

            {activeScoringPopup && (
              <div
                id="rule-change-popup"
                role="dialog"
                aria-label="Scoring updates details"
                className="absolute left-0 top-[calc(100%+8px)] z-20 w-[min(88vw,320px)] rounded-xl border border-amber-300/40 bg-slate-900/95 p-3 shadow-xl backdrop-blur"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-200">
                    {activeScoringPopup === 'knockout' ? 'Knockout Points' : 'Community Weightage Point'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveScoringPopup(null)}
                    className="rounded p-0.5 text-white/70 hover:text-white"
                    aria-label="Close scoring popup"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                </div>

                <div className="mt-1 rounded-md border border-amber-300/40 bg-amber-400/10 px-3 py-2 flex items-start gap-2">
                  <span className="text-sm leading-none mt-0.5">⚠️</span>
                  {activeScoringPopup === 'knockout' ? (
                    <p className="text-sm text-white/90">
                      <span className="font-semibold text-amber-200">Knockout Matches:</span> Get +2 points for correctly predicting the penalty shootout winner.
                    </p>
                  ) : (
                    <p className="text-sm text-white/80 leading-relaxed">
                      <span className="font-semibold text-amber-200">Community Weightage Point:</span> 1 point per 10 community members starting from Group Stage Round 3.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content: Matches to Predict */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div
              className="relative overflow-hidden rounded-xl p-4 shadow-lg border border-white/10"
              style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%), ' +
                    'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,1) 28px, rgba(255,255,255,1) 29px)',
                }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black tracking-wider text-white/60">My Current Rank</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-[2.75rem] leading-none font-black text-amber-400">
                      {userStats.final.rank === '-' ? '–' : `#${userStats.final.rank}`}
                    </span>
                    <span className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/80">
                      {userStats.final.totalPoints} pts
                    </span>
                  </div>
                </div>
                <div className="rounded-full bg-white/10 p-2 border border-white/15">
                  <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M7 2h10v2h3a1 1 0 0 1 1 1v2a6 6 0 0 1-6 6h-1.1A5 5 0 0 1 13 14.9V17h3a1 1 0 0 1 1 1v2H7v-2a1 1 0 0 1 1-1h3v-2.1A5 5 0 0 1 10.1 13H9a6 6 0 0 1-6-6V5a1 1 0 0 1 1-1h3V2Zm-2 4v1a4 4 0 0 0 4 4h.3A5 5 0 0 1 7 7V6H5Zm14 0h-2v1a5 5 0 0 1-2.3 4H15a4 4 0 0 0 4-4V6Z" />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-xl p-4 shadow-lg border border-white/10"
              style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%), ' +
                    'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,1) 28px, rgba(255,255,255,1) 29px)',
                }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-black tracking-wider text-white/60">Last Match Rank</p>
                    {userStats.daily.lastMatchTag && (
                      <span className="text-[10px] font-bold text-sky-400/80 truncate max-w-[100px]">{userStats.daily.lastMatchTag}</span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl sm:text-[2.75rem] leading-none font-black text-sky-300">
                      {userStats.daily.rank === '-' ? '–' : `#${userStats.daily.rank}`}
                    </span>
                    <span className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/80">
                      {userStats.daily.totalPoints} pts
                    </span>
                  </div>
                </div>
                <div className="rounded-full bg-white/10 p-2 border border-white/15">
                  <svg className="h-5 w-5 text-sky-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 8a1 1 0 0 1 1 1v3.382l2.447 1.223a1 1 0 1 1-.894 1.79l-3-1.5A1 1 0 0 1 11 14V9a1 1 0 0 1 1-1Z" />
                    <path fillRule="evenodd" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Matches to Predict</h2>
            <Link
              to="/my-predictions"
              className="group inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/70 shadow-lg backdrop-blur-sm transition-all duration-200 hover:border-sky-400/50 hover:bg-white/10 hover:text-white"
            >
              <span>Previous Predictions</span>
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-secondary"></div>
              <p className="mt-4 text-sm sm:text-base text-white/60">Loading matches...</p>
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
                <div className="col-span-full text-center py-12 text-white/60">
                  No matches scheduled yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar: Stats */}
        <div className="lg:col-span-1 space-y-4">
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 p-4 shadow-2xl"
            style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%), ' +
                  'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,1) 28px, rgba(255,255,255,1) 29px)',
              }}
            />
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/90 border border-white/20">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <h3 className="text-sm font-extrabold tracking-wide text-white">My Community Rank</h3>
              </div>
             
            </div>

            <div className="relative z-10 space-y-3">
              {userStats.communities.length > 0 ? (
                userStats.communities.map((comm) => (
                  <div key={comm.communityId} className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 backdrop-blur-sm">
                    <p className="mb-2 text-xs font-extrabold tracking-wide text-white/90">{comm.name}</p>
                    <div className="grid grid-cols-1 gap-2">
                      {(() => {
                        const name = comm.name.replace(/ — Community Members$/, '');
                        const points = comm.overall?.totalPoints ?? 0;
                        return (
                          <Link
                            to={`/community/${comm.communityId}/members?name=${encodeURIComponent(name)}&pts=${points}`}
                            className="block rounded-lg border border-sky-300/25 bg-sky-400/10 px-3 py-2 text-left hover:bg-sky-400/20 hover:border-sky-300/45 transition-all"
                          >
                            <span className="block text-[10px] font-bold tracking-wider text-white/55">Current Rank</span>
                            <div className="mt-1 flex items-baseline gap-2">
                              <span className="block text-lg font-black text-sky-200">{comm.overall?.rank === '-' ? '–' : `#${comm.overall?.rank}`}</span>
                              <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90">{points} pts</span>
                            </div>
                          </Link>
                        );
                      })()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-white/25 bg-white/5 px-3 py-4 text-center text-xs font-semibold text-white/70">
                  You are not assigned to any community yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Dashboard;
