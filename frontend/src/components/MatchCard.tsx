import React, { useState, useEffect } from 'react';
import { Match, Prediction } from '../types';
import { format } from 'date-fns';

function formatLocalKickoff(date: Date) {
  try {
    // Get browser languages to respect user preference where possible
    const userLocales = typeof navigator !== 'undefined' && navigator.languages 
      ? Array.from(navigator.languages) 
      : [];
      
    // Look for a North American locale (US or Canada) in the user's preferences
    // This ensures proper timezone abbreviations like PDT/EDT instead of GMT offsets
    const naLocale = userLocales.find(lang => lang.includes('-US') || lang.includes('-CA'));
    
    // Default to 'en-US' if no NA locale is found in their browser settings
    const localeToUse = naLocale || 'en-US';

    return date.toLocaleString(localeToUse, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  } catch {
    return format(date, 'MMM dd, yyyy hh:mm a');
  }
}
import { apiService } from '../services/apiService';

interface MatchCardProps {
  match: Match;
  userPrediction?: Prediction;
  onPredictionSubmit?: (matchId: string, team1Score: number, team2Score: number, penaltyShootoutWinner?: string) => void;
}

interface GroupStandingRow {
  teamId: string;
  teamName: string;
  teamLogo?: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

function normalizeGroupKey(group?: string | null): string | null {
  if (!group) return null;
  const trimmed = group.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^group\s+/i, '').trim().toUpperCase();
}

function toDisplayGroupLabel(groupKey: string): string {
  return `Group ${groupKey}`;
}

function isNumericScore(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

// ── Countdown hook ─────────────────────────────────────────────────────────────
function useCountdown(targetDate: string) {
  const calc = () => {
    const diff = new Date(targetDate).getTime() - Date.now();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return { d, h, m, s };
  };
  const [remaining, setRemaining] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return remaining;
}

// ── Flag image with fallback ───────────────────────────────────────────────────
const Flag: React.FC<{ src?: string | null; alt: string }> = ({ src, alt }) => {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-bold text-xs shrink-0">
        {alt.slice(0, 3)}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErr(true)}
      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white/30 shadow-lg shrink-0"
    />
  );
};

// ── Single countdown unit ──────────────────────────────────────────────────────
const CountUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center min-w-[1.8rem]">
    <span className="text-white font-black text-base leading-none tabular-nums">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-white/40 text-[8px] uppercase tracking-widest mt-0.5">{label}</span>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
const MatchCard: React.FC<MatchCardProps> = ({ match, userPrediction, onPredictionSubmit }) => {
  const isCompleted = match.status === 'completed';
  const isOngoing   = match.status === 'ongoing';
  const isPublishing = match.status === 'publishing';
  const isPredictionOpen = new Date(match.predictionsEndingTime) > new Date();

  const [team1Score, setTeam1Score] = useState<number | ''>('');
  const [team2Score, setTeam2Score] = useState<number | ''>('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [submitted, setSubmitted]   = useState(false);
  const [penaltyShootoutWinner, setPenaltyShootoutWinner] = useState<string>('');
  const [showGroupTable, setShowGroupTable] = useState(false);
  const [groupTableLoading, setGroupTableLoading] = useState(false);
  const [groupTableError, setGroupTableError] = useState('');
  const [groupStandings, setGroupStandings] = useState<GroupStandingRow[]>([]);

  const countdown = useCountdown(match.predictionsEndingTime);

  useEffect(() => {
    if (userPrediction) {
      setTeam1Score(userPrediction.team1Score);
      setTeam2Score(userPrediction.team2Score);
      setPenaltyShootoutWinner(userPrediction.penaltyShootoutWinner || '');
    } else {
      setTeam1Score('');
      setTeam2Score('');
      setPenaltyShootoutWinner('');
    }
  }, [userPrediction]);

  const knockoutMatch = Boolean(match.isKnockoutMatch);
  const predictedDraw = team1Score !== '' && team2Score !== '' && Number(team1Score) === Number(team2Score);

  const handleSubmit = async () => {
    if (!isPredictionOpen) return;
    if (team1Score === '' || team2Score === '') {
      setError('Enter both scores');
      return;
    }
    const nextTeam1Score = Number(team1Score);
    const nextTeam2Score = Number(team2Score);
    const requiresPenaltyWinner = knockoutMatch && nextTeam1Score === nextTeam2Score;
    const normalizedPenaltyWinner = penaltyShootoutWinner.trim();

    if (requiresPenaltyWinner && !normalizedPenaltyWinner) {
      setError('Select penalty shootout winner for knockout draw prediction');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await apiService.submitPrediction({
        matchId: match.matchId,
        team1Score: nextTeam1Score,
        team2Score: nextTeam2Score,
        penaltyShootoutWinner: requiresPenaltyWinner ? normalizedPenaltyWinner : null,
        comment: '',
      });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2500);
      if (onPredictionSubmit) {
        onPredictionSubmit(
          match.matchId,
          nextTeam1Score,
          nextTeam2Score,
          requiresPenaltyWinner ? normalizedPenaltyWinner : undefined
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const t1Name = match.team1Info?.teamName ?? match.team1;
  const t2Name = match.team2Info?.teamName ?? match.team2;
  const roundLabel = /^\d+$/.test(match.round.trim()) ? `Round ${match.round}` : match.round;
  const groupKey = normalizeGroupKey(match.group);
  const groupLabel = groupKey ? toDisplayGroupLabel(groupKey) : null;
  const hasExistingPenaltyPrediction =
    knockoutMatch &&
    userPrediction &&
    isNumericScore(userPrediction.team1Score) &&
    isNumericScore(userPrediction.team2Score) &&
    userPrediction.team1Score === userPrediction.team2Score &&
    userPrediction.penaltyShootoutWinner;
  const predictedPenaltyWinnerName =
    hasExistingPenaltyPrediction && userPrediction?.penaltyShootoutWinner === match.team1 ? t1Name : t2Name;

  const loadGroupStandings = async () => {
    if (!groupKey) return;

    try {
      setGroupTableLoading(true);
      setGroupTableError('');

      const res = await apiService.getAllMatches(undefined, 1, 500);
      const allMatches: Match[] = res.data?.matches || [];
      const groupMatches = allMatches.filter((m) => normalizeGroupKey(m.group) === groupKey);

      const table = new Map<string, GroupStandingRow>();

      const upsertTeam = (teamId: string, teamName: string, teamLogo?: string | null) => {
        if (!table.has(teamId)) {
          table.set(teamId, {
            teamId,
            teamName,
            teamLogo,
            played: 0,
            won: 0,
            drawn: 0,
            lost: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDifference: 0,
            points: 0,
          });
        }
      };

      for (const gm of groupMatches) {
        const team1Id = gm.team1;
        const team2Id = gm.team2;
        const team1Name = gm.team1Info?.teamName ?? gm.team1;
        const team2Name = gm.team2Info?.teamName ?? gm.team2;
        const team1Logo = gm.team1Info?.countryLogo;
        const team2Logo = gm.team2Info?.countryLogo;

        upsertTeam(team1Id, team1Name, team1Logo);
        upsertTeam(team2Id, team2Name, team2Logo);

        const t1 = table.get(team1Id)!;
        const t2 = table.get(team2Id)!;

        if (!isNumericScore(gm.team1Score) || !isNumericScore(gm.team2Score)) {
          continue;
        }

        const s1 = gm.team1Score;
        const s2 = gm.team2Score;

        t1.played += 1;
        t2.played += 1;

        t1.goalsFor += s1;
        t1.goalsAgainst += s2;
        t2.goalsFor += s2;
        t2.goalsAgainst += s1;

        if (s1 > s2) {
          t1.won += 1;
          t2.lost += 1;
          t1.points += 3;
        } else if (s2 > s1) {
          t2.won += 1;
          t1.lost += 1;
          t2.points += 3;
        } else {
          t1.drawn += 1;
          t2.drawn += 1;
          t1.points += 1;
          t2.points += 1;
        }
      }

      const rows = Array.from(table.values()).map((row) => ({
        ...row,
        goalDifference: row.goalsFor - row.goalsAgainst,
      }));

      rows.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
        return a.teamName.localeCompare(b.teamName);
      });

      setGroupStandings(rows);
      setShowGroupTable(true);
    } catch (err) {
      setGroupTableError('Unable to load group standings right now.');
      setShowGroupTable(true);
    } finally {
      setGroupTableLoading(false);
    }
  };

  const statusBadge = isCompleted
    ? <span className="px-2 py-0.5 rounded-full bg-gray-500/70 text-[10px] font-bold text-white">Full Time</span>
    : isOngoing
    ? <span className="px-2 py-0.5 rounded-full bg-green-500/80 text-[10px] font-bold text-white animate-pulse">● Live</span>
    : isPublishing
    ? <span className="px-2 py-0.5 rounded-full bg-amber-500/80 text-[10px] font-bold text-white">Publishing</span>
    : isPredictionOpen
      ? <span className="px-2 py-0.5 rounded-full bg-blue-500/70 text-[10px] font-bold text-white">Upcoming</span>
      : null;

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:shadow-blue-900/30"
      style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
    >
      {/* Subtle pitch overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%)',
        }}
      />

      {/* ── Header: tag / round / status ── */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-[10px] font-semibold text-white/50 uppercase tracking-widest truncate max-w-[120px]">
          {match.matchTag || 'Group Stage'}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {groupLabel && (
            <button
              type="button"
              onClick={loadGroupStandings}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/25 text-[10px] font-semibold text-indigo-100 border border-indigo-300/25 hover:bg-indigo-500/35 transition"
              title={`Show ${groupLabel} table`}
            >
              <svg className="w-3.5 h-3.5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18M8 4v16M16 4v16" />
              </svg>
              <span>{groupLabel}</span>
            </button>
          )}
          <span className="text-[10px] text-white/30 font-medium">{roundLabel}</span>
          {statusBadge}
        </div>
      </div>

      {/* ── Teams + score ── */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 gap-2">
        {/* Team 1 */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <Flag src={match.team1Info?.countryLogo} alt={match.team1} />
          <span className="text-white font-bold text-[13px] text-center leading-tight line-clamp-2 max-w-[100px]">
            {t1Name}
          </span>
        </div>

        {/* Score / Inputs */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="flex items-center gap-1.5">
            {isCompleted ? (
              <>
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center text-white font-black text-xl">
                  {match.team1Score ?? 0}
                </div>
                <span className="text-white/40 font-bold text-lg">–</span>
                <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center text-white font-black text-xl">
                  {match.team2Score ?? 0}
                </div>
              </>
            ) : (
              <>
                <input
                  type="number" min="0" max="20"
                  disabled={!isPredictionOpen || loading}
                  value={team1Score}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') return setTeam1Score('');
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) setTeam1Score(Math.min(20, Math.max(0, num)));
                  }}
                  placeholder="–"
                  className="w-12 h-12 bg-white/10 border border-white/25 rounded-lg text-center text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-sky-400/40 disabled:opacity-40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="text-white/30 font-bold text-lg">–</span>
                <input
                  type="number" min="0" max="20"
                  disabled={!isPredictionOpen || loading}
                  value={team2Score}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') return setTeam2Score('');
                    const num = parseInt(val, 10);
                    if (!isNaN(num)) setTeam2Score(Math.min(20, Math.max(0, num)));
                  }}
                  placeholder="–"
                  className="w-12 h-12 bg-white/10 border border-white/25 rounded-lg text-center text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-sky-400/60 focus:border-sky-400/40 disabled:opacity-40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </>
            )}
          </div>
          {!isCompleted && (
            <span className="text-white/30 text-[9px] uppercase tracking-widest">
              {isPredictionOpen ? 'Your Prediction' : 'Closed'}
            </span>
          )}
          {!isCompleted && isPredictionOpen && knockoutMatch && predictedDraw && (
            <div className="mt-1 flex flex-col items-center gap-1.5">
              <span className="text-[9px] uppercase tracking-widest text-amber-300/90 font-semibold text-center">
                Penalty shootout winner
              </span>
              <select
                value={penaltyShootoutWinner}
                onChange={(e) => setPenaltyShootoutWinner(e.target.value)}
                className="min-w-[170px] h-9 bg-white/10 border border-white/25 rounded-md px-3 py-1.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-sky-400/60"
              >
                <option value="" className="bg-slate-900 text-sm">Select winner</option>
                <option value={match.team1} className="bg-slate-900 text-sm">{t1Name}</option>
                <option value={match.team2} className="bg-slate-900 text-sm">{t2Name}</option>
              </select>
              <span className="text-[9px] text-white/45 text-center leading-tight max-w-[140px]">
                Correct winner earns +2 points.
              </span>
            </div>
          )}
          {!isCompleted && !isPredictionOpen && hasExistingPenaltyPrediction && (
            <div className="mt-2 flex flex-col items-center gap-0.5">
              <span className="text-[9px] uppercase tracking-widest text-amber-300/90 font-semibold text-center">
                Penalty Winner Pick
              </span>
              <span className="text-sm font-bold text-white">{predictedPenaltyWinnerName}</span>
            </div>
          )}
          {isCompleted && (
            <span className="text-white/30 text-[9px] uppercase tracking-widest">Final Score</span>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
          <Flag src={match.team2Info?.countryLogo} alt={match.team2} />
          <span className="text-white font-bold text-[13px] text-center leading-tight line-clamp-2 max-w-[100px]">
            {t2Name}
          </span>
        </div>
      </div>

      {/* ── Error message ── */}
      {error && (
        <p className="relative z-10 text-red-400 text-[11px] text-center px-4 -mt-1 mb-1 font-medium">{error}</p>
      )}

      {/* ── Match time + countdown ── */}
      <div className="relative z-10 flex items-start justify-between px-4 py-3 gap-4">

        {/* Kick-off time in browser local time */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-white/35 text-[9px] uppercase tracking-widest">Kick-off</span>
          <span className="text-white/80 text-xs font-bold leading-tight">
            {formatLocalKickoff(new Date(match.matchTime))}
          </span>
        </div>

        {/* Countdown or close time */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-white/35 text-[9px] uppercase tracking-widest text-right">
            {isPredictionOpen ? 'Prediction closes in' : isCompleted ? 'Match ended' : 'Prediction closed'}
          </span>
          {isPredictionOpen && countdown ? (
            <div className="flex items-end gap-1">
              {countdown.d > 0 && (
                <>
                  <CountUnit value={countdown.d} label="d" />
                  <span className="text-white/30 font-bold text-sm leading-none pb-3">:</span>
                </>
              )}
              <CountUnit value={countdown.h} label="h" />
              <span className="text-white/30 font-bold text-sm leading-none pb-3">:</span>
              <CountUnit value={countdown.m} label="m" />
              <span className="text-white/30 font-bold text-sm leading-none pb-3">:</span>
              <CountUnit value={countdown.s} label="s" />
            </div>
          ) : (
            <span className="text-white/40 text-xs font-semibold">
              {format(new Date(match.predictionsEndingTime), 'MMM dd, h:mm a')}
            </span>
          )}
        </div>
      </div>

      {/* ── Submit / status button ── */}
      <div className="relative z-10 px-4 pb-4">
        {!isCompleted ? (
          <button
            onClick={handleSubmit}
            disabled={loading || !isPredictionOpen}
            className={`w-full py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
              submitted
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                : isPredictionOpen
                ? 'bg-gradient-to-r from-blue-600 to-sky-400 text-white hover:brightness-110 active:scale-[0.98] shadow-lg shadow-sky-500/20'
                : 'bg-white/8 text-white/25 cursor-not-allowed border border-white/10'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Submitting…
              </span>
            ) : submitted ? (
              '✓ Prediction Saved!'
            ) : isPredictionOpen ? (
              userPrediction ? 'Update Prediction' : 'Submit Prediction'
            ) : (
              'Prediction Closed'
            )}
          </button>
        ) : (
          <div className="w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-center text-white/30 text-sm font-bold tracking-wide">
            Full Time
          </div>
        )}
      </div>

      {showGroupTable && groupLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={() => setShowGroupTable(false)}>
          <div
            className="w-full max-w-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
            style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 60%, #0c1a1a 100%)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-white font-bold text-lg">{groupLabel} Standings</h3>
              <button
                type="button"
                onClick={() => setShowGroupTable(false)}
                className="text-white/70 hover:text-white text-sm font-semibold"
              >
                Close
              </button>
            </div>

            <div className="p-4">
              {groupTableLoading && <p className="text-white/70 text-sm">Loading standings...</p>}
              {!groupTableLoading && groupTableError && (
                <p className="text-red-300 text-sm">{groupTableError}</p>
              )}
              {!groupTableLoading && !groupTableError && groupStandings.length === 0 && (
                <p className="text-white/60 text-sm">No teams available for this group yet.</p>
              )}

              {!groupTableLoading && !groupTableError && groupStandings.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm text-white/90">
                    <thead>
                      <tr className="text-white/50 border-b border-white/10">
                        <th className="py-2 pr-2 text-left">#</th>
                        <th className="py-2 pr-2 text-left">Team</th>
                        <th className="py-2 px-1 text-center">P</th>
                        <th className="py-2 px-1 text-center">W</th>
                        <th className="py-2 px-1 text-center">D</th>
                        <th className="py-2 px-1 text-center">L</th>
                        <th className="py-2 px-1 text-center">GF</th>
                        <th className="py-2 px-1 text-center">GA</th>
                        <th className="py-2 px-1 text-center">GD</th>
                        <th className="py-2 pl-2 text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupStandings.map((row, idx) => (
                        <tr key={row.teamId} className="border-b border-white/5 last:border-0">
                          <td className="py-2 pr-2 text-white/70">{idx + 1}</td>
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2 min-w-[120px]">
                              {row.teamLogo ? (
                                <img
                                  src={row.teamLogo}
                                  alt={row.teamName}
                                  className="w-5 h-5 rounded-full object-cover border border-white/20"
                                />
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 inline-flex items-center justify-center text-[10px] font-bold">
                                  {row.teamName.slice(0, 1).toUpperCase()}
                                </span>
                              )}
                              <span className="truncate">{row.teamName}</span>
                            </div>
                          </td>
                          <td className="py-2 px-1 text-center">{row.played}</td>
                          <td className="py-2 px-1 text-center">{row.won}</td>
                          <td className="py-2 px-1 text-center">{row.drawn}</td>
                          <td className="py-2 px-1 text-center">{row.lost}</td>
                          <td className="py-2 px-1 text-center">{row.goalsFor}</td>
                          <td className="py-2 px-1 text-center">{row.goalsAgainst}</td>
                          <td className="py-2 px-1 text-center">{row.goalDifference}</td>
                          <td className="py-2 pl-2 text-right font-bold">{row.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
