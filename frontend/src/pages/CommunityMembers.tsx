import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';

interface RankingItem {
  userId: string;
  name: string;
  rank?: number | string;
  totalPoints?: number;
  state?: string;
}

const CommunityMembers: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const [searchParams] = useSearchParams();
  const communityName = searchParams.get('name') ?? 'Community';
  const communityPts = searchParams.get('pts');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (communityId) {
      loadRanking();
    }
  }, [communityId]);

  const loadRanking = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getCommunityRanking(communityId!);
      
      const sortedData = [...(res.data.ranking || [])].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      let currentRank = 0;
      let previousPoints: number | null = null;
      const communityRanking = sortedData.map(item => {
        if (item.totalPoints !== previousPoints) {
          currentRank++;
          previousPoints = item.totalPoints;
        }
        return { ...item, rank: currentRank };
      });
      
      setRanking(communityRanking);
    } catch (err) {
      console.error('Failed to load ranking:', err);
      setError('Failed to load ranking details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-primary px-4 py-5 shadow-md">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-grow">
            <h1 className="text-white font-bold text-lg leading-tight">{communityName}</h1>
            <p className="text-blue-100 text-xs mt-0.5">Community Members</p>
          </div>
          {communityPts && (
            <div className="flex flex-col items-end">
              <span className="text-xl sm:text-2xl font-black text-amber-400 leading-none">{communityPts}</span>
              <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest mt-0.5">Total Pts</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto py-4 px-4">
        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-500 text-sm">Fetching ranks...</p>
          </div>
        ) : error ? (
          <div className="py-12 text-center text-red-400 text-sm px-6 bg-white/10 border border-white/10 rounded-2xl">
            {error}
          </div>
        ) : (
          <div className="bg-white/10 border border-white/10 rounded-2xl overflow-hidden">
            {/* Count badge */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-white/50 uppercase tracking-wider">
                {ranking.length} {ranking.length === 1 ? 'Member' : 'Members'}
              </span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {ranking.map((item) => {
                const isMe = item.userId === user?.userId;
                return (
                  <div
                    key={item.userId}
                    className={`flex items-center justify-between gap-4 px-4 py-3 transition ${isMe ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="flex shrink-0 items-center justify-center w-8 h-8 rounded-full bg-sky-500/20 text-sky-300 font-bold text-sm">
                            {item.rank || '-'}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className={`text-sm font-bold truncate ${isMe ? 'text-secondary' : 'text-white'}`}>
                                    {item.name}
                                </p>
                                {isMe && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded">YOU</span>}
                            </div>
                            <p className="text-xs text-white/50 truncate">{item.state || 'Unknown Location'}</p>
                        </div>
                    </div>
                    <div className="text-right shrink-0">
                        <span className="text-lg font-black text-amber-400">{item.totalPoints ?? 0}</span>
                        <span className="text-xs text-white/50 ml-1">pts</span>
                    </div>
                  </div>
                );
              })}

              {ranking.length === 0 && (
                <div className="py-16 text-center px-6">
                  <p className="text-white/40 text-sm font-medium">No rankings available yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityMembers;
