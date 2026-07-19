import React, { useEffect, useState } from 'react';
import { apiService } from '../services/apiService';
import { KnockoutLeaderboardEntry, KnockoutRound } from '../types';

const ROUND_OPTIONS: Array<{ key: KnockoutRound; label: string; subtitle: string }> = [
  { key: 'R16', label: 'R16 Leaderboard', subtitle: 'Round of 16 points' },
  { key: 'R8', label: 'Quarter Leaderboard', subtitle: 'Quarterfinal points' },
  { key: 'Semi', label: 'Semifinal Leaderboard', subtitle: 'Semifinal points' },
];

interface KnockoutLeaderboardProps {
  initialRound?: KnockoutRound;
  allowRoundSwitch?: boolean;
  showHeader?: boolean;
  title?: string;
  subtitle?: string;
  limit?: number;
}

const KnockoutLeaderboard: React.FC<KnockoutLeaderboardProps> = ({
  initialRound = 'R16',
  allowRoundSwitch = true,
  showHeader = true,
  title = 'Knockout Leaderboard',
  subtitle = 'Use the buttons to switch between the R16, Quarter, and Semifinal leaderboards.',
  limit = 10,
}) => {
  const [entries, setEntries] = useState<KnockoutLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRound, setActiveRound] = useState<KnockoutRound>(initialRound);

  useEffect(() => {
    setActiveRound(initialRound);
  }, [initialRound]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setError('');
        setLoading(true);
        const res = await apiService.getKnockoutLeaderboard(limit, activeRound);
        if (!active) return;
        setEntries(res.data.leaderboard || []);
      } catch (err) {
        if (!active) return;
        setError('Failed to load knockout leaderboard.');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [activeRound, limit]);

  return (
    <section className="mb-12 sm:mb-16">
      {showHeader && (
        <div className="flex items-end justify-between gap-3 mb-4 sm:mb-5 flex-wrap">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-white">{title}</h2>
            <p className="text-white/50 text-xs sm:text-sm">{subtitle}</p>
          </div>
        </div>
      )}

      {allowRoundSwitch && (
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-5">
          {ROUND_OPTIONS.map((option) => {
            const isActive = activeRound === option.key;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setActiveRound(option.key)}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-sky-500/20 border-sky-400/50 text-white shadow-lg shadow-sky-500/10'
                    : 'bg-white/5 border-white/10 text-white/65 hover:bg-white/10 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#0c1a1a] px-6 py-12 text-center text-white/50">
          Loading knockout leaderboard…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-6 py-12 text-center text-red-200">
          {error}
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] via-[#1a2744] to-[#0c1a1a] px-6 py-12 text-center text-white/50">
          No knockout leaderboard entries yet.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 100%)' }}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-white/40">Name</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-white/40">Points</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.userId} className="border-b border-white/[0.06] hover:bg-white/5 transition">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{entry.name}</div>
                      <div className="text-xs text-white/40 mt-1">
                        {[entry.community1, entry.community2].filter(Boolean).join(' · ')}
                        {entry.state ? ` · ${entry.state}` : ''}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-secondary">{entry[activeRound]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-white/10">
            {entries.map((entry) => (
              <div key={entry.userId} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="text-sm font-bold text-white">{entry.name}</div>
                    <div className="text-xs text-white/40 mt-1">
                      {[entry.community1, entry.community2].filter(Boolean).join(' · ')}
                      {entry.state ? ` · ${entry.state}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-secondary">{entry[activeRound]}</div>
                    <div className="text-xs text-white/40">pts</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default KnockoutLeaderboard;