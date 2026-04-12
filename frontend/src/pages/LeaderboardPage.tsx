import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../context/store';
import { apiService } from '../services/api';
import { LeaderboardData } from '../types';
import { applyDenseRanking } from '../utils/ranking';


export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'top' | 'community'>('top');
  const [selectedCommunity, setSelectedCommunity] = useState<any | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Fetch both Top Leaders and Community Leaderboards
      const matchId = '1';
      const [topRes, commRes] = await Promise.all([
        apiService.getTopLeaderboard(100, matchId),
        apiService.getCommunityLeaderboard(100, matchId)
      ]);


      setLeaderboardData({
        individual: applyDenseRanking(topRes.data?.leaderboard || []),
        community: applyDenseRanking(commRes.data?.leaderboard || [])
      });
    } catch (error: any) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1: return <span className="text-2xl">🥇</span>;
      case 2: return <span className="text-2xl">🥈</span>;
      case 3: return <span className="text-2xl">🥉</span>;
      default: return <span className="text-gray-400 font-bold ml-1">#{rank}</span>;
    }
  };

  const isUserEntry = (entry: any) => {
    if (activeTab === 'top') {
      return entry.email === user?.Email;
    }
    return entry.communityId === user?.Community_ID;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-green-900 tracking-tight">Leaderboards</h1>
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
            ? 'border-green-600 text-green-700 bg-green-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          🏆 Top Leaders
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`px-6 py-4 text-sm sm:text-base font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'community'
            ? 'border-green-600 text-green-700 bg-green-50/50'
            : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          👥 Communities
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] shadow-sm border border-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mb-4"></div>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Standings...</p>
        </div>
      ) : leaderboardData ? (
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
          {/* Table Header Row */}
          <div className="bg-green-800 px-6 py-4 flex items-center text-white font-black uppercase tracking-widest text-[10px] sm:text-xs">
            <div className="w-16 sm:w-24">Rank</div>
            <div className="flex-1">
              {activeTab === 'top' ? 'Participant' : 'Community Name'}
            </div>
            <div className="text-right w-24 sm:w-32">Points</div>
          </div>

          <div className="divide-y divide-gray-100">
            {activeTab === 'top' ? (
              leaderboardData.individual && leaderboardData.individual.length > 0 ? (
                leaderboardData.individual.map((entry: any, index: number) => {
                  const rank = entry.denseRank || index + 1;
                  return (
                    <div
                      key={entry.email}
                      className={`px-6 py-4 flex items-center hover:bg-gray-50 transition-colors ${isUserEntry(entry) ? 'bg-green-50/80 ring-2 ring-green-600/20 ring-inset' :
                        rank <= 3 ? 'bg-blue-50/30' : ''
                        }`}
                    >
                      <div className="w-16 sm:w-24 flex items-center">{getRankMedal(rank)}</div>
                      <div className="flex-1 flex flex-col">
                        <span className="font-black text-gray-800 sm:text-lg tracking-tight">
                          {entry.firstName ? `${entry.firstName} ${entry.lastName}` : entry.email}
                        </span>
                        {isUserEntry(entry) && (
                          <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">
                            Your Performance
                          </span>
                        )}
                      </div>
                      <div className="text-right w-24 sm:w-32">
                        <span className="text-xl sm:text-2xl font-black text-green-700">{entry.totalPoints}</span>
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
              leaderboardData.community && leaderboardData.community.length > 0 ? (
                leaderboardData.community.map((entry: any, index: number) => {
                  const rank = entry.denseRank || index + 1;
                  return (
                    <div
                      key={entry.communityId}
                      onClick={() => setSelectedCommunity(entry)}
                      className={`cursor-pointer px-6 py-4 flex items-center hover:bg-gray-50 transition-colors ${isUserEntry(entry) ? 'bg-green-50/80 ring-2 ring-green-600/20 ring-inset' :
                        rank <= 3 ? 'bg-blue-50/30' : ''
                        }`}
                    >
                      <div className="w-16 sm:w-24 flex items-center">{getRankMedal(rank)}</div>
                      <div className="flex-1 flex flex-col">
                        <span className="font-black text-gray-800 sm:text-lg tracking-tight">
                          {entry.Name || entry.communityName}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {entry.Member_Count || entry.memberCount || 0} Members participating
                        </span>
                      </div>
                      <div className="text-right w-24 sm:w-32 flex flex-col">
                        <span className="text-xl sm:text-2xl font-black text-green-700">
                          {typeof entry.Average_Accuracy !== 'undefined'
                            ? entry.Average_Accuracy.toFixed(1)
                            : (entry.totalPoints != null ? entry.totalPoints.toFixed(1) : '0.0')}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase">Avg Pts</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center">
                  <span className="text-4xl mb-4 block">👥</span>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No community data yet</p>
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

      {/* Community Detail Modal */}
      {selectedCommunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedCommunity(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-green-800 to-emerald-900 px-6 py-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white">{selectedCommunity.Name || selectedCommunity.communityName}</h3>
                <p className="text-green-200 text-xs font-bold uppercase tracking-widest mt-1">Halaqa Roster</p>
              </div>
              <button
                onClick={() => setSelectedCommunity(null)}
                className="text-white/80 hover:text-white transition bg-white/10 hover:bg-white/20 rounded-full h-8 w-8 flex items-center justify-center leading-none"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto bg-gray-50 p-6 space-y-3">
              {applyDenseRanking(
                leaderboardData?.individual
                  ?.filter((user: any) => String(user.communityId) === String(selectedCommunity.communityId))
                  .sort((a: any, b: any) => b.totalPoints - a.totalPoints) || []
              ).map((user: any, idx: number) => (
                <div key={user.email} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm hover:shadow transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 text-gray-500 font-black h-8 w-8 rounded-full flex items-center justify-center text-xs">
                      #{user.denseRank}
                    </div>
                    <span className="font-bold text-gray-800 text-lg">{user.firstName ? `${user.firstName} ${user.lastName}` : user.email}</span>
                  </div>
                  <span className="font-black text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                    {user.totalPoints}
                  </span>
                </div>
              ))}

              {(!leaderboardData?.individual || leaderboardData?.individual?.filter((u: any) => String(u.communityId) === String(selectedCommunity.communityId)).length === 0) && (
                <div className="text-center py-10">
                  <span className="text-4xl block mb-3">👻</span>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active predictions from this community yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
