import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LeaderboardEntry, CommunityLeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[] | CommunityLeaderboardEntry[];
  type: 'user' | 'community';
  title: string;
  subtitle?: string;
  showCommunityUnderName?: boolean;
  hideState?: boolean;
  disableNavigation?: boolean;
  hideRank?: boolean;
}

const medalIcon = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return null;
};

const Leaderboard: React.FC<LeaderboardProps> = ({
  entries,
  type,
  title,
  subtitle,
  showCommunityUnderName = false,
  hideState = false,
  disableNavigation = false,
  hideRank = false,
}) => {
  const navigate = useNavigate();

  const handleRowClick = (entry: any) => {
    if (type === 'community' && entry.communityId && !disableNavigation) {
      navigate(`/community/${entry.communityId}/members?name=${encodeURIComponent(entry.communityName || '')}&pts=${entry.totalPoints || 0}`);
    }
  };

  return (
    <div className="rounded-xl shadow overflow-hidden border border-white/10">
      {/* Header */}
      <div
        className="relative text-white px-4 py-3 sm:px-6 sm:py-4"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
      >
        {/* Pitch overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 50% at 50% 50%, #ffffff 0%, transparent 70%), ' +
              'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,255,255,1) 28px, rgba(255,255,255,1) 29px)',
          }}
        />
        <div className="relative z-10 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg sm:text-2xl font-bold">{title}</h2>
          {subtitle && (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 border border-white/25 text-xs font-semibold text-white tracking-wide shadow-inner">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* ── Mobile: card list (hidden on sm+) ── */}
      <ul className="divide-y divide-white/10 sm:hidden" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 100%)' }}>
        {entries.map((entry) => {
          const key =
            type === 'user'
              ? String((entry as LeaderboardEntry).userId ?? (entry as any).email ?? `row-${entry.rank}`)
              : String(
                  (entry as CommunityLeaderboardEntry).communityId ??
                    (entry as CommunityLeaderboardEntry).communityName ??
                    `row-${entry.rank}`
                );
          const medal = medalIcon(entry.rank);
          const isTop3 = entry.rank <= 3;
          const name =
            type === 'user'
              ? (entry as LeaderboardEntry).name
              : (entry as CommunityLeaderboardEntry).communityName;
          const c1 = type === 'user' ? (entry as LeaderboardEntry).community1 : null;
          const c2 = type === 'user' ? (entry as LeaderboardEntry).community2 : null;
          const state = type === 'user' && !hideState ? (entry as LeaderboardEntry).state : null;

          return (
            <li
              key={key}
              className={`flex items-center gap-3 px-4 py-3 ${isTop3 ? 'bg-white/5' : ''} ${type === 'community' && !disableNavigation ? 'cursor-pointer hover:bg-white/10' : ''}`}
              onClick={() => type === 'community' && handleRowClick(entry)}
            >
              {/* Rank */}
              {!hideRank && (
                <div className="flex-shrink-0 w-10 text-center">
                  {medal ? (
                    <span className="text-xl">{medal}</span>
                  ) : (
                    <span className="text-sm font-bold text-white/40">#{entry.rank}</span>
                  )}
                </div>
              )}

              {/* Name + meta */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{name}</p>
                {type === 'community' && ((entry as any).CommunityFullname || (entry as any).communityFullName) && (
                  <p className="text-xs text-white/50 truncate">
                    {(entry as any).CommunityFullname || (entry as any).communityFullName}
                  </p>
                )}
                {showCommunityUnderName && (c1 || c2) && (
                  <p className="text-xs text-white/40 truncate">
                    {[c1, c2].filter(Boolean).join(' · ')}
                  </p>
                )}
                {state && <p className="text-xs text-white/40">{state}</p>}
              </div>

              {/* Points */}
              <div className="flex-shrink-0 text-right">
                <span className="text-sm font-bold text-secondary">{entry.totalPoints}</span>
                <p className="text-xs text-white/40">pts</p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ── Desktop: table (hidden below sm) ── */}
      <div className="hidden sm:block overflow-x-auto" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 100%)' }}>
        <table className="w-full">
          <thead className="border-b border-white/10">
            <tr>
              {!hideRank && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Rank</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                {type === 'user' ? 'Name' : 'Community'}
              </th>
              {type === 'user' && (
                <>
                  {!hideState && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">State</th>
                  )}
                  {!showCommunityUnderName && (
                    <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">Communities</th>
                  )}
                </>
              )}
              <th className="px-6 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">Points</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={
                  type === 'user'
                    ? String((entry as LeaderboardEntry).userId ?? (entry as any).email ?? `row-${entry.rank}`)
                    : String(
                        (entry as CommunityLeaderboardEntry).communityId ??
                          (entry as CommunityLeaderboardEntry).communityName ??
                          `row-${entry.rank}`
                      )
                }
              className={`border-b border-white/[0.06] transition ${entry.rank <= 3 ? 'bg-white/5' : ''} ${type === 'community' && !disableNavigation ? 'cursor-pointer hover:bg-white/10' : 'hover:bg-white/5'}`}
              onClick={() => type === 'community' && handleRowClick(entry)}
              >
                {!hideRank && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {medalIcon(entry.rank) && <span>{medalIcon(entry.rank)}</span>}
                      <span className="font-bold text-white/60">#{entry.rank}</span>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <p className="font-medium text-white">
                    {type === 'user'
                      ? (entry as LeaderboardEntry).name
                      : (entry as CommunityLeaderboardEntry).communityName}
                  </p>
                  {type === 'community' && ((entry as any).CommunityFullname || (entry as any).communityFullName) && (
                    <div className="text-xs text-white/50 mt-1">
                      {(entry as any).CommunityFullname || (entry as any).communityFullName}
                    </div>
                  )}
                  {showCommunityUnderName && type === 'user' && (
                    <div className="text-xs text-white/40 mt-1 space-y-0.5">
                      {(entry as LeaderboardEntry).community1 && (
                        <div>{(entry as LeaderboardEntry).community1}</div>
                      )}
                      {(entry as LeaderboardEntry).community2 && (
                        <div>{(entry as LeaderboardEntry).community2}</div>
                      )}
                    </div>
                  )}
                </td>
                {type === 'user' && (
                  <>
                    {!hideState && (
                      <td className="px-6 py-4 text-white/50">
                        {(entry as LeaderboardEntry).state || '-'}
                      </td>
                    )}
                    {!showCommunityUnderName && (
                      <td className="px-6 py-4 text-sm text-white/50">
                        {(entry as LeaderboardEntry).community1 && (
                          <span className="block">{(entry as LeaderboardEntry).community1}</span>
                        )}
                        {(entry as LeaderboardEntry).community2 && (
                          <span className="block">{(entry as LeaderboardEntry).community2}</span>
                        )}
                      </td>
                    )}
                  </>
                )}
                <td className="px-6 py-4 text-right font-bold text-secondary">
                  {entry.totalPoints}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="text-center py-8 text-white/40" style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 100%)' }}>No entries yet</div>
      )}
    </div>
  );
};

export default Leaderboard;
