import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../context/store';
import { apiService } from '../services/api';
import { Prediction } from '../types';
import { applyDenseRanking } from '../utils/ranking';


type PartyKey = 'UDF' | 'LDF' | 'NDA';

const PREDICTION_END_DATE = new Date('2026-05-04T02:30:00Z');

function calculateTimeLeft() {
  const difference = +PREDICTION_END_DATE - +new Date();
  let timeLeft = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: difference
  };

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      total: difference
    };
  }

  return timeLeft;
}

export default function DashboardPage() {
  const { user, setUser } = useAuthStore();
  const [community, setCommunity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Prediction State
  const [scores, setScores] = useState({ UDF: 0, LDF: 0, NDA: 0 });
  const [existingPrediction, setExistingPrediction] = useState<Prediction | null>(null);
  const [match, setMatch] = useState<any>(null);
  const [halaqaMembers, setHalaqaMembers] = useState<any[]>([]);
  const [showHalaqaModal, setShowHalaqaModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining.total <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch full profile if needed
      if (user && (!user.City || !user.Status)) {
        const profileRes = await apiService.getProfile();
        if (profileRes.data) {
          setUser(profileRes.data);
        }
      }

      // 2. Fetch community details
      if (user?.Community_ID) {
        const commRes = await apiService.getCommunity(user.Community_ID.toString());
        setCommunity(commRes.data);
      }

      // 3. Fetch existing prediction and match status
      if (user?.Email) {
        try {
          const [predRes, matchRes] = await Promise.all([
            apiService.getUserPredictions({ email: user.Email, matchId: '1' }),
            apiService.getMatchById('1')
          ]);

          setMatch(matchRes.data.data);

          if (predRes.data && predRes.data.data && predRes.data.data.length > 0) {
            const pred = predRes.data.data[0];
            setExistingPrediction(pred);
            setScores({
              UDF: pred.UDF_Score,
              LDF: pred.LDF_Score,
              NDA: pred.NDA_Score
            });
          }
        } catch (err) {
          console.error('Error fetching prediction/match:', err);
        }
      }

      // 4. Fetch halaqa members and their points
      if (user?.Community_ID) {
        try {
          const [membersRes, lbRes] = await Promise.all([
            apiService.getCommunityMembers(user.Community_ID.toString()),
            apiService.getTopLeaderboard(200, '1')
          ]);

          const allUsers: any[] = membersRes.data || [];
          const leaderboardEntries: any[] = lbRes.data?.leaderboard || [];

          const members = allUsers.map(u => {
            const scoreEntry = leaderboardEntries.find(le => le.email === u.Email);
            return {
              email: u.Email,
              firstName: u.First_Name,
              lastName: u.Last_Name,
              totalPoints: scoreEntry ? scoreEntry.totalPoints : 0,
              hasPredicted: !!scoreEntry
            };
          });

          // Sort by points if finalized, otherwise by name
          const sortedMembers = members.sort((a: any, b: any) => {
            if (match?.IsFinalized) {
              return b.totalPoints - a.totalPoints || a.firstName.localeCompare(b.firstName);
            }
            return a.firstName.localeCompare(b.firstName);
          });

          setHalaqaMembers(sortedMembers);
        } catch (_) {
          // best-effort
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.Email, user?.Community_ID, setUser, match?.IsFinalized]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-clear success messages after 3 seconds
  useEffect(() => {
    if (message?.type === 'success') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleScoreChange = (party: PartyKey, value: string) => {
    const numValue = value === '' ? 0 : Math.max(0, parseInt(value) || 0);
    setScores(prev => ({ ...prev, [party]: numValue }));
    setMessage(null);
  };

  const totalScores = scores.UDF + scores.LDF + scores.NDA;
  const isTotalValid = totalScores === 140;
  const isClosed = timeLeft.total <= 0;
  const remainingSeats = 140 - totalScores;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTotalValid || !user?.Email) return;

    setSubmitting(true);
    setMessage(null);

    try {
      await apiService.submitPrediction({
        Email: user.Email,
        matchId: '1',
        UDF_Score: scores.UDF,
        LDF_Score: scores.LDF,
        NDA_Score: scores.NDA
      });
      setMessage({ type: 'success', text: 'Prediction saved successfully!' });

      // Refresh local data to show user in Halaqa lists immediately
      await fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to save prediction' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  const parties: PartyKey[] = ['UDF', 'LDF', 'NDA'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-green-900 tracking-tight">
            Welcome, {user?.First_Name}!
          </h1>
          <p className="text-gray-600 font-medium">
            {community?.Name ? `Representing ${community.Name}` : 'Kerala Election Predictor Hub'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative overflow-hidden group">
            <div className="relative bg-white rounded-[2rem] shadow-2xl border border-white/20 overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
              <div className="absolute top-0 left-0 w-full h-56 z-0 overflow-hidden">
                {/* <img src="/dashboard-bg.png" alt="Card Header BG" className="w-full h-full object-cover object-top" /> */}
                <div className="absolute inset-0 bg-green-700"></div>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl z-0"></div>

              <div className="relative z-10 p-6 sm:p-8">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30">
                    <span className="text-xs font-black text-white uppercase tracking-widest">Main Election Match</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-white uppercase tracking-wider">Live Predictions Open</span>
                  </div>
                </div>

                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-white drop-shadow-md tracking-tight">
                    Kerala Assembly 2026
                  </h2>
                  <p className="text-green-100 text-sm mt-1 font-medium italic opacity-90">
                    Predict the pulse of God's Own Country
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-3 gap-4 sm:gap-8 items-center">
                    {/* UDF */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2 shadow-inner border transition-all bg-blue-100 border-blue-200">
                        {/* <img src="/udf.png" alt="UDF" className="w-full h-full object-contain" /> */}
                      </div>
                      <span className="text-lg font-black text-blue-500 uppercase tracking-widest">UDF</span>
                      <input
                        type="number"
                        min="0"
                        max="140"
                        value={scores.UDF || ''}
                        onChange={(e) => handleScoreChange('UDF', e.target.value)}
                        className="w-full h-16 text-center text-3xl font-black rounded-2xl border-2 transition-all shadow-sm focus:ring-0 bg-gray-50 border-gray-100 text-blue-800 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>

                    {/* LDF */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2 shadow-inner border transition-all bg-red-100 border-red-200">
                        {/* <img src="/ldf.png" alt="LDF" className="w-full h-full object-contain" /> */}
                      </div>
                      <span className="text-lg font-black text-red-500 uppercase tracking-widest">LDF</span>
                      <input
                        type="number"
                        min="0"
                        max="140"
                        value={scores.LDF || ''}
                        onChange={(e) => handleScoreChange('LDF', e.target.value)}
                        className="w-full h-16 text-center text-3xl font-black rounded-2xl border-2 transition-all shadow-sm focus:ring-0 bg-gray-50 border-gray-100 text-red-800 focus:border-red-500"
                        placeholder="0"
                      />
                    </div>

                    {/* NDA */}
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center p-2 shadow-inner border transition-all bg-orange-100 border-orange-200">
                        {/* <img src="/nda.png" alt="NDA" className="w-full h-full object-contain" /> */}
                      </div>
                      <span className="text-lg font-black text-orange-500 uppercase tracking-widest">NDA</span>
                      <input
                        type="number"
                        min="0"
                        max="140"
                        value={scores.NDA || ''}
                        onChange={(e) => handleScoreChange('NDA', e.target.value)}
                        className="w-full h-16 text-center text-3xl font-black rounded-2xl border-2 transition-all shadow-sm focus:ring-0 bg-gray-50 border-gray-100 text-orange-800 focus:border-orange-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {message && (
                    <div className={`p-4 rounded-2xl text-center text-sm font-bold animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-green-100 border border-green-200 text-green-800' : 'bg-red-100 border border-red-200 text-red-800'
                      }`}>
                      {message.text}
                    </div>
                  )}

                  <div className="bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-200 flex justify-between items-center transform transition-all duration-300">
                    <div>
                      <span className="text-[9px] font-black text-gray-400 uppercase block tracking-[0.2em] mb-0.5">Total Prediction</span>
                      <span className={`text-lg font-black tabular-nums transition-colors duration-300 ${isTotalValid ? 'text-green-600' : 'text-red-500'}`}>
                        {totalScores} / 140
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-black text-gray-400 uppercase block tracking-[0.2em] mb-0.5">Remaining</span>
                      <span className={`text-base font-black tabular-nums transition-colors duration-300 ${remainingSeats === 0 ? 'text-green-600' : remainingSeats < 0 ? 'text-red-500' : 'text-orange-500'}`}>
                        {remainingSeats === 0 ? '✓ Ready' : `${remainingSeats} Seats`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !isTotalValid || isClosed}
                    className={`w-full py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] ${isTotalValid && !isClosed
                      ? 'bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white hover:brightness-110'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {isClosed ? 'Predictions Closed' : submitting ? 'Updating...' : existingPrediction ? 'Update Prediction' : 'Submit Prediction'}
                  </button>

                  {!isClosed && (
                    <div className="pt-6 border-t border-gray-100 mt-6">
                      <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="h-[1px] bg-green-200 flex-1"></div>
                        <span className="text-[11px] font-black text-green-800 uppercase tracking-[0.4em] whitespace-nowrap">
                          Predictions Closing In
                        </span>
                        <div className="h-[1px] bg-green-200 flex-1"></div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-green-50/50 rounded-2xl py-4 flex flex-col items-center justify-center border border-green-100/50">
                          <span className="text-3xl sm:text-4xl font-black text-green-700 tabular-nums">
                            {String(timeLeft.days).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] font-black text-green-600/50 uppercase tracking-[0.2em] mt-1">Days</span>
                        </div>
                        <div className="bg-green-50/50 rounded-2xl py-4 flex flex-col items-center justify-center border border-green-100/50">
                          <span className="text-3xl sm:text-4xl font-black text-green-700 tabular-nums">
                            {String(timeLeft.hours).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] font-black text-green-600/50 uppercase tracking-[0.2em] mt-1">Hours</span>
                        </div>
                        <div className="bg-green-50/50 rounded-2xl py-4 flex flex-col items-center justify-center border border-green-100/50">
                          <span className="text-3xl sm:text-4xl font-black text-green-700 tabular-nums">
                            {String(timeLeft.minutes).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] font-black text-green-600/50 uppercase tracking-[0.2em] mt-1">Mins</span>
                        </div>
                        <div className="bg-green-50/50 rounded-2xl py-4 flex flex-col items-center justify-center border border-green-100/50">
                          <span className="text-3xl sm:text-4xl font-black text-green-700 tabular-nums">
                            {String(timeLeft.seconds).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] font-black text-green-600/50 uppercase tracking-[0.2em] mt-1">Secs</span>
                        </div>
                      </div>
                    </div>
                  )}
                </form>

                <div className="mt-8 flex justify-end items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2">
                  {/* <div className="flex flex-col">
                    <span>Election Date:</span>
                    <span className="text-gray-600">May 2026</span>
                  </div>
                  <div className="text-center flex flex-col">
                    <span>Prediction Ends:</span>
                    <span className="text-gray-600 font-black">20 May, 18:00</span>
                  </div> */}
                  {/*make this card to the right end of the parent div */}

                  <div className="flex flex-col text-right">
                    <span>Assembly Size:</span>
                    <span className="text-gray-600">140 Seats</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card hover:shadow-lg transition-all group">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Community Spirit</h3>
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-100 text-emerald-700 p-4 rounded-2xl text-3xl shadow-inner">
                🏆
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-800 group-hover:text-green-700 transition-colors">
                  {community?.Name || 'Independent'}
                </h4>
                {community?.President_Name && (
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest -mt-1 mb-1">
                    President: <span className="text-green-700">{community.President_Name}</span>
                  </p>
                )}
                <Link to="/leaderboard" className="text-xs font-bold text-green-600 hover:text-green-700">
                  VIEW FULL LEADERBOARD →
                </Link>
              </div>
            </div>
          </div>

          {/* My Points Card */}
          <div className="card hover:shadow-lg transition-all">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">My Points</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 text-green-700 p-4 rounded-2xl text-3xl shadow-inner">⭐</div>
                <div>
                  {/* <p className="text-3xl font-black text-green-700">
                    {existingPrediction ? (existingPrediction as any).Total_Points ?? '-' : '—'}
                  </p> */}
                  <p className="text-3xl font-black text-green-700">
                    {existingPrediction && existingPrediction.Total_Points !== null
                      ? existingPrediction.Total_Points
                      : '—'}
                  </p>

                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Points</p>
                </div>
              </div>
            </div>
            {community?.Name && (
              <button
                onClick={() => setShowHalaqaModal(true)}
                className="mt-4 w-full text-xs font-black text-green-600 hover:text-green-800 uppercase tracking-widest transition-colors text-left"
              >
                View {community.Name} Members Points →
              </button>
            )}
          </div>

          <div className="card bg-amber-50 border-amber-200 shadow-sm">
            <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span>⚠️</span> Election Rules
            </h3>
            <ul className="text-xs text-amber-800 space-y-3 font-bold opacity-80">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                Predictions must sum to 140
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                Points awarded after official results
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-amber-600 rounded-full"></span>
                Updates allowed until closing time
              </li>
            </ul>
          </div>
        </div>
      </div>
      {showHalaqaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
          onClick={() => setShowHalaqaModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-green-800 to-emerald-900 px-6 py-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white">{community?.Name}</h3>
                <p className="text-green-200 text-xs font-bold uppercase tracking-widest mt-1">Halaqa Members Points</p>
              </div>
              <button
                onClick={() => setShowHalaqaModal(false)}
                className="text-white/80 hover:text-white transition bg-white/10 hover:bg-white/20 rounded-full h-8 w-8 flex items-center justify-center leading-none"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto bg-gray-50 p-6 space-y-3">
              {halaqaMembers.length > 0 ? applyDenseRanking(halaqaMembers).map((member: any) => (
                <div
                  key={member.email}
                  className={`bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm transition-shadow hover:shadow ${member.email === user?.Email ? 'border-green-300 ring-2 ring-green-400/30' : 'border-gray-100'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`font-black h-8 w-8 rounded-full flex items-center justify-center text-xs ${member.email === user?.Email ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      #{member.denseRank}
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">{member.firstName ? `${member.firstName} ${member.lastName}` : member.email}</span>
                      {member.email === user?.Email && (
                        <span className="ml-2 text-[10px] font-black text-green-600 uppercase tracking-widest">You</span>
                      )}
                    </div>
                  </div>
                  <span className="font-black text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                    {match?.IsFinalized ? (member.totalPoints ?? 0) : '—'}
                  </span>
                </div>
              )) : (
                <div className="text-center py-10">
                  <span className="text-4xl block mb-3">👻</span>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No predictions from your community yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
