import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface Winner {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  photoId: string | null;
  roundName: string;
  rank: number;
  city: string;
  state: string;
  country: string;
}

interface CommunityWinner {
  id: number;
  communityId: number;
  communityShortName: string;
  communityLongName: string | null;
  photoId: string | null;
  roundName: string;
  rank: number;
  city: string;
  state: string;
  country: string;
}

/** Preferred display order — rounds not in this list appear at the end in the order they arrive. */
const PREFERRED_ORDER = ['GR1', 'GR2', 'GR3', 'Group Round 1', 'Group Round 2', 'Group Round 3', 'R32', 'R16', 'R8', 'Semi', 'Third', 'Final'];

function sortRounds(rounds: string[]): string[] {
  return [...rounds].sort((a, b) => {
    const ai = PREFERRED_ORDER.indexOf(a);
    const bi = PREFERRED_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

const RANK_MEDAL: Record<number, { icon: string; color: string; bg: string }> = {
  1: { icon: '🥇', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  2: { icon: '🥈', color: 'text-slate-300', bg: 'bg-slate-400/10 border-slate-400/30' },
  3: { icon: '🥉', color: 'text-amber-600', bg: 'bg-amber-700/10 border-amber-600/30' },
};

/** Fetches a winner photo via axios (so it goes through the HTTP client) and renders a round avatar. */
const WinnerPhoto: React.FC<{ photoId: string; initials: string }> = ({ photoId, initials }) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let revoked = false;
    setObjectUrl(null);
    setFailed(false);

    apiService
      .getWinnerPhoto(photoId)
      .then((res) => {
        if (revoked) return;
        const url = URL.createObjectURL(res.data as Blob);
        setObjectUrl(url);
      })
      .catch(() => {
        if (!revoked) setFailed(true);
      });

    return () => {
      revoked = true;
      setObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [photoId]);

  const fallback = (
    <div className="w-24 h-24 rounded-full border-2 border-white/20 shadow-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white">
      {initials}
    </div>
  );

  if (failed || objectUrl === null) return fallback;

  return (
    <img
      src={objectUrl}
      alt="winner"
      className="w-24 h-24 rounded-full object-cover border-2 border-white/20 shadow-lg"
      onError={() => setFailed(true)}
    />
  );
};

const WinnersPage: React.FC = () => {
  const [groupedUsers, setGroupedUsers] = useState<Record<string, Winner[]>>({});
  const [groupedCommunities, setGroupedCommunities] = useState<Record<string, CommunityWinner[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeUserRound, setActiveUserRound] = useState<string>('');
  const [activeCommunityRound, setActiveCommunityRound] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await apiService.getWinners();
        const usersData: Record<string, Winner[]> = res.data.groupedUsers || res.data.grouped || {};
        const communitiesData: Record<string, CommunityWinner[]> = res.data.groupedCommunities || {};

        setGroupedUsers(usersData);
        setGroupedCommunities(communitiesData);

        const availableUserRounds = sortRounds(Object.keys(usersData).filter((r) => usersData[r]?.length > 0));
        if (availableUserRounds.length > 0) {
          setActiveUserRound(availableUserRounds[availableUserRounds.length - 1]);
        }

        const availableCommunityRounds = sortRounds(Object.keys(communitiesData).filter((r) => communitiesData[r]?.length > 0));
        if (availableCommunityRounds.length > 0) {
          setActiveCommunityRound(availableCommunityRounds[availableCommunityRounds.length - 1]);
        }
      } catch (err) {
        setError('Failed to load winners. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const availableUserRounds = sortRounds(Object.keys(groupedUsers).filter((r) => groupedUsers[r]?.length > 0));
  const availableCommunityRounds = sortRounds(Object.keys(groupedCommunities).filter((r) => groupedCommunities[r]?.length > 0));
  const hasAnyWinners = availableUserRounds.length > 0 || availableCommunityRounds.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      {/* Page header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">🏆 Round Winners</h1>
        <p className="text-white/50 text-sm sm:text-base">Top users and communities for each stage of the tournament</p>
      </div>

      {loading && (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
          <p className="mt-4 text-white/50 text-sm">Loading winners…</p>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-16 text-red-400">{error}</div>
      )}

      {!loading && !error && !hasAnyWinners && (
        <div className="text-center py-16 text-white/40">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-lg font-medium">No winners announced yet</p>
          <p className="text-sm mt-2">Check back after each round is complete!</p>
        </div>
      )}

      {!loading && !error && hasAnyWinners && (
        <>
          {availableUserRounds.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 text-center">Top Leaders</h2>

              <div className="sm:hidden mb-6">
                <select
                  value={activeUserRound}
                  onChange={(e) => setActiveUserRound(e.target.value)}
                  className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-[#1a2744] focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {availableUserRounds.map((r) => (
                    <option key={r} value={r} className="bg-gray-900 text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-0">
                {availableUserRounds.map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveUserRound(r)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap -mb-px ${
                      activeUserRound === r
                        ? 'border-sky-400 text-sky-400'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {activeUserRound && groupedUsers[activeUserRound] && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {groupedUsers[activeUserRound]
                    .slice()
                    .sort((a, b) => a.rank - b.rank)
                    .map((winner) => {
                      const medal = RANK_MEDAL[winner.rank];
                      const address = [winner.city, winner.state, winner.country]
                        .map((v) => (v || '').trim())
                        .filter((v) => v.length > 0)
                        .join(', ');
                      return (
                        <div
                          key={winner.id}
                          className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl flex flex-col items-center gap-3 transition-all duration-300 hover:scale-[1.02] ${
                            medal ? medal.bg : 'bg-white/5 border-white/10'
                          }`}
                          style={
                            !medal
                              ? { background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 60%, #0c1a1a 100%)' }
                              : undefined
                          }
                        >
                          <div className="absolute top-3 left-3">
                            {medal ? (
                              <span className="text-2xl">{medal.icon}</span>
                            ) : (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-white/10 text-white/60 border border-white/10`}
                              >
                                #{winner.rank}
                              </span>
                            )}
                          </div>

                          <div className="mt-2">
                            {winner.photoId ? (
                              <WinnerPhoto
                                photoId={winner.photoId}
                                initials={winner.firstName.charAt(0).toUpperCase()}
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-full border-2 border-white/20 shadow-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white">
                                {winner.firstName.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          <div className="text-center">
                            <p className="text-white font-semibold text-base leading-tight">
                              {winner.firstName} {winner.lastName}
                            </p>
                            {address && (
                              <p className="text-xs text-white/50 mt-1">{address}</p>
                            )}
                            {medal && (
                              <p className={`text-xs font-medium mt-0.5 ${medal.color}`}>
                                {winner.rank === 1 ? '1st Place' : winner.rank === 2 ? '2nd Place' : '3rd Place'}
                              </p>
                            )}
                            {!medal && (
                              <p className="text-xs text-white/40 mt-0.5">Rank #{winner.rank}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>
          )}

          {availableCommunityRounds.length > 0 && (
            <section>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-5 text-center">Community Winners</h2>

              <div className="sm:hidden mb-6">
                <select
                  value={activeCommunityRound}
                  onChange={(e) => setActiveCommunityRound(e.target.value)}
                  className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm font-medium text-white bg-[#1a2744] focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {availableCommunityRounds.map((r) => (
                    <option key={r} value={r} className="bg-gray-900 text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="hidden sm:flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-0">
                {availableCommunityRounds.map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveCommunityRound(r)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap -mb-px ${
                      activeCommunityRound === r
                        ? 'border-sky-400 text-sky-400'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {activeCommunityRound && groupedCommunities[activeCommunityRound] && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  {groupedCommunities[activeCommunityRound]
                    .slice()
                    .sort((a, b) => a.rank - b.rank)
                    .map((winner) => {
                      const medal = RANK_MEDAL[winner.rank];
                      const address = [winner.city, winner.state, winner.country]
                        .map((v) => (v || '').trim())
                        .filter((v) => v.length > 0)
                        .join(', ');
                      const displayName = winner.communityLongName?.trim() || winner.communityShortName;
                      const initials = winner.communityShortName?.charAt(0).toUpperCase() || 'C';
                      return (
                        <div
                          key={winner.id}
                          className={`relative overflow-hidden rounded-2xl border p-5 shadow-xl flex flex-col items-center gap-3 transition-all duration-300 hover:scale-[1.02] ${
                            medal ? medal.bg : 'bg-white/5 border-white/10'
                          }`}
                          style={
                            !medal
                              ? { background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 60%, #0c1a1a 100%)' }
                              : undefined
                          }
                        >
                          <div className="absolute top-3 left-3">
                            {medal ? (
                              <span className="text-2xl">{medal.icon}</span>
                            ) : (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-white/10 text-white/60 border border-white/10`}
                              >
                                #{winner.rank}
                              </span>
                            )}
                          </div>

                          <div className="mt-2">
                            {winner.photoId ? (
                              <WinnerPhoto photoId={winner.photoId} initials={initials} />
                            ) : (
                              <div className="w-24 h-24 rounded-full border-2 border-white/20 shadow-lg bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white">
                                {initials}
                              </div>
                            )}
                          </div>

                          <div className="text-center">
                            <p className="text-white font-semibold text-base leading-tight">{displayName}</p>
                            <p className="text-xs text-white/60 mt-1">{winner.communityShortName}</p>
                            {address && (
                              <p className="text-xs text-white/50 mt-1">{address}</p>
                            )}
                            {medal && (
                              <p className={`text-xs font-medium mt-0.5 ${medal.color}`}>
                                {winner.rank === 1 ? '1st Place' : winner.rank === 2 ? '2nd Place' : '3rd Place'}
                              </p>
                            )}
                            {!medal && (
                              <p className="text-xs text-white/40 mt-0.5">Rank #{winner.rank}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default WinnersPage;
