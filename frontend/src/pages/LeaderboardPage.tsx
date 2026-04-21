import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../context/store';
import { apiService } from '../services/api';
import { LeaderboardData } from '../types';
import { applyDenseRanking } from '../utils/ranking';


export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [communities, setCommunities] = useState<any[]>([]);
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'top' | 'community'>('top');
  const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);
  const [modalMembers, setModalMembers] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const matchId = '1';
      const [topRes, commRes, communitiesRes, matchRes] = await Promise.all([
        apiService.getTopLeaderboard(100, matchId),
        apiService.getCommunityLeaderboard(100, matchId),
        apiService.getCommunities(),
        apiService.getMatchById(matchId)
      ]);

      setLeaderboardData({
        individual: applyDenseRanking(topRes.data?.leaderboard || []),
        community: applyDenseRanking(commRes.data?.leaderboard || [])
      });
      setCommunities(communitiesRes.data || []);
      setMatch(matchRes.data.data);
    } catch (error: any) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedCommunity) {
        setModalMembers([]);
        return;
      }
      setModalLoading(true);
      try {
        const communityId = selectedCommunity.Community_ID || selectedCommunity.communityId;
        const res = await apiService.getCommunityMembers(String(communityId));
        setModalMembers(res.data || []);
      } catch (err) {
        console.error('Failed to fetch community members:', err);
      } finally {
        setModalLoading(false);
      }
    };
    fetchMembers();
  }, [selectedCommunity]);

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1: return <span className="text-2xl">🥇</span>;
      case 2: return <span className="text-2xl">🥈</span>;
      case 3: return <span className="text-2xl">🥉</span>;
      default: return <span className="text-gray-400 font-bold ml-1">#{rank}</span>;
    }
  };

  const isUserEntry = (entry: any) => {
    const entryCommId = entry.Community_ID || entry.communityId;
    if (activeTab === 'top') {
      return entry.email === user?.Email;
    }
    return String(entryCommId) === String(user?.Community_ID);
  };

  const getMergedCommunities = () => {
    if (!communities.length) return leaderboardData?.community || [];

    return communities.map(c => {
      const lb = leaderboardData?.community?.find(
        (l: any) => String(l.communityId) === String(c.Community_ID)
      );
      return {
        ...c,
        ...(lb || {}),
        communityId: c.Community_ID, // Ensure consistency
        Name: c.Name || lb?.Name || lb?.communityName
      };
    }).sort((a, b) => {
      // Sort by rank if available, then by name
      if (a.denseRank && b.denseRank) return a.denseRank - b.denseRank;
      if (a.denseRank) return -1;
      if (b.denseRank) return 1;
      return a.Name.localeCompare(b.Name);
    });
  };

  const mergedCommunities = getMergedCommunities();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-kerala-blue-900 tracking-tight">Leaderboards</h1>
          <p className="text-gray-600 font-medium mt-1">
            Kerala Assembly Election 2026 Participation Standings
          </p>
        </div>
      </div>

      {/* FIFA-Style Tabs */}
      <div className="flex space-x-1 sm:space-x-2 border-b border-gray-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('top')}
          className={`px-6 py-4 text-sm sm:text-base font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'top'
            ? 'border-kerala-blue-600 text-kerala-blue-700 bg-kerala-blue-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          🏆 Top Leaders
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`px-6 py-4 text-sm sm:text-base font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'community'
            ? 'border-kerala-blue-600 text-kerala-blue-700 bg-kerala-blue-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          👥 Halaqas
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] shadow-sm border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-kerala-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Standings...</p>
        </div>
      ) : leaderboardData ? (
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          {/* Table Header Row */}
          <div className="relative bg-kerala-blue-700 px-6 py-4 overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
            </div>
            <div className="relative z-10 flex items-center text-white font-black uppercase tracking-widest text-[10px] sm:text-xs">
              {match?.IsFinalized && <div className="w-16 sm:w-24">Rank</div>}
              <div className="flex-1">
                {activeTab === 'top' ? 'Participant' : 'Halaqa Name'}
              </div>
              {match?.IsFinalized && <div className="text-right w-24 sm:w-32">Points</div>}
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {activeTab === 'top' ? (
              !match?.IsFinalized ? (
                <div className="py-20 text-center">
                  <span className="text-4xl mb-4 block">🏆</span>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Top Leaders will appear once election results are finalized</p>
                </div>
              ) : leaderboardData.individual && leaderboardData.individual.length > 0 ? (
                leaderboardData.individual.map((entry: any, index: number) => {
                  const rank = entry.denseRank || index + 1;
                  return (
                    <div
                      key={entry.email}
                      className={`px-6 py-4 flex items-center hover:bg-gray-50 transition-colors ${isUserEntry(entry) ? 'bg-kerala-blue-50/80 ring-2 ring-kerala-blue-600/20 ring-inset' :
                        rank <= 3 ? 'bg-kerala-blue-50/30' : ''
                        }`}
                    >
                      {match?.IsFinalized && <div className="w-16 sm:w-24 flex items-center">{getRankMedal(rank)}</div>}
                      <div className="flex-1 flex flex-col">
                        <span className="font-black text-gray-800 sm:text-lg tracking-tight">
                          {entry.firstName ? `${entry.firstName} ${entry.lastName}` : entry.email}
                        </span>
                        {isUserEntry(entry) && (
                          <span className="text-[10px] font-black text-kerala-blue-600 uppercase tracking-tighter">
                            Your Performance
                          </span>
                        )}
                      </div>
                      <div className="text-right w-24 sm:w-32">
                        <span className="text-xl sm:text-2xl font-black text-kerala-blue-700">
                          {match?.IsFinalized ? entry.totalPoints : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center">
                  <span className="text-4xl mb-4 block">🏟️</span>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Waiting for first predictions...</p>
                </div>
              )
            ) : (
              mergedCommunities.length > 0 ? (
                mergedCommunities.map((entry: any, index: number) => {
                  const rank = entry.denseRank || '-';
                  return (
                    <div
                      key={entry.Community_ID || entry.communityId}
                      onClick={() => setSelectedCommunity(entry)}
                      className={`cursor-pointer px-6 py-4 flex items-center hover:bg-gray-50 transition-colors ${isUserEntry(entry) ? 'bg-kerala-blue-50/80 ring-2 ring-kerala-blue-600/20 ring-inset' :
                        rank !== '-' && rank <= 3 ? 'bg-kerala-blue-50/30' : ''
                        }`}
                    >
                      {match?.IsFinalized && (
                        <div className="w-16 sm:w-24 flex items-center">
                          {rank !== '-' ? getRankMedal(rank) : <span className="text-gray-300 ml-1">#—</span>}
                        </div>
                      )}
                      <div className="flex-1 flex flex-col">
                        <span className="font-black text-gray-800 sm:text-lg tracking-tight">
                          {entry.Name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {entry.Member_Count || entry.memberCount || 0} Members participating
                        </span>
                      </div>
                      {match?.IsFinalized && (
                        <div className="text-right w-24 sm:w-32 flex flex-col">
                          <span className="text-xl sm:text-2xl font-black text-kerala-blue-700">
                            {typeof entry.Average_Accuracy !== 'undefined'
                              ? entry.Average_Accuracy.toFixed(1)
                              : (entry.totalPoints != null ? entry.totalPoints.toFixed(1) : '0.0')}
                          </span>
                          <span className="text-[10px] font-black text-gray-400 uppercase">Avg Pts</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center">
                  <span className="text-4xl mb-4 block">👥</span>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Halaqa data yet</p>
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2rem] p-20 text-center shadow-sm border border-gray-100">
          <span className="text-5xl mb-6 block">🗳️</span>
          <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Preparing Standings</h3>
          <p className="text-gray-500 font-medium mt-2">Leaderboard data will be available once calculations begin.</p>
        </div>
      )}

      {selectedCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedCommunity(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="relative bg-gradient-to-r from-kerala-blue-800 to-kerala-blue-950 px-6 py-6 overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] animate-pulse"></div>
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white">{selectedCommunity.Name}</h3>
                  <p className="text-kerala-blue-200 text-xs font-bold uppercase tracking-widest mt-1">Halaqa Members</p>
                </div>
                <button
                  onClick={() => setSelectedCommunity(null)}
                  className="text-white/80 hover:text-white transition bg-white/10 hover:bg-white/20 rounded-full h-8 w-8 flex items-center justify-center leading-none"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto bg-gray-50 p-6 space-y-3">
              {modalLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-kerala-blue-600 border-t-transparent mb-2"></div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fetching Members...</p>
                </div>
              ) : modalMembers.length > 0 ? (
                applyDenseRanking(
                  modalMembers.map(m => {
                    const lbEntry = leaderboardData?.individual?.find(le => le.email === m.Email);
                    return {
                      ...m,
                      firstName: m.First_Name,
                      lastName: m.Last_Name,
                      email: m.Email,
                      totalPoints: lbEntry ? lbEntry.totalPoints : 0,
                      hasPredicted: !!lbEntry
                    };
                  }).sort((a: any, b: any) => {
                    if (match?.IsFinalized) {
                      return b.totalPoints - a.totalPoints || a.firstName.localeCompare(b.firstName);
                    }
                    return a.firstName.localeCompare(b.firstName);
                  })
                ).map((member: any) => (
                  <div key={member.email} className={`bg-white p-4 rounded-xl border flex justify-between items-center shadow-sm hover:shadow transition-shadow ${member.email === user?.Email ? 'border-kerala-blue-300 ring-2 ring-kerala-blue-400/30' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`font-black h-8 w-8 rounded-full flex items-center justify-center text-xs ${member.email === user?.Email ? 'bg-kerala-blue-100 text-kerala-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {match?.IsFinalized && member.hasPredicted ? `#${member.denseRank}` : '•'}
                      </div>
                      <div>
                        <span className="font-bold text-gray-800 text-lg">
                          {member.firstName} {member.lastName}
                        </span>
                        {member.email === user?.Email && (
                          <span className="ml-2 text-[10px] font-black text-kerala-blue-600 uppercase tracking-widest">You</span>
                        )}
                        {!member.hasPredicted && (
                          <span className="ml-2 text-[10px] font-bold text-gray-400 uppercase tracking-tight italic">(No prediction)</span>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-kerala-blue-700 bg-kerala-blue-50 px-3 py-1 rounded-lg">
                      {match?.IsFinalized ? (member.totalPoints ?? 0) : '—'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <span className="text-4xl block mb-3">👻</span>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No members registered in this Halaqa yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
