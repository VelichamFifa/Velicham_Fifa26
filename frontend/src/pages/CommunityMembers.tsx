import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/apiService';

interface RankingItem {
  userId: string;
  name: string;
  totalPoints: number;
  rank: number;
  state?: string;
}

const CommunityMembers: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const [searchParams] = useSearchParams();
  const communityName = searchParams.get('name') ?? 'Community';
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
      const res = await apiService.getCommunityRanking(communityId!, false);
      setRanking(res.data.ranking);
    } catch (err) {
      console.error('Failed to load ranking:', err);
      setError('Failed to load ranking details');
    } finally {
      setLoading(false);
    }
  };

  const medalColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">{communityName}</h1>
            <p className="text-blue-100 text-xs mt-0.5">Community Members</p>
          </div>
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
          <div className="py-12 text-center text-red-500 text-sm px-6 bg-white rounded-2xl shadow">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {/* Count badge */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {ranking.length} {ranking.length === 1 ? 'Member' : 'Members'}
              </span>
            </div>

            <div className="divide-y divide-gray-50">
              {ranking.map((item) => {
                const isMe = item.userId === user?.userId;
                return (
                  <div
                    key={`${item.userId}-${item.rank}-${item.totalPoints}`}
                    className={`flex items-center gap-4 px-4 py-3 transition ${isMe ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                  >
                    {/* Rank */}
                    <div className="w-9 flex-shrink-0 text-center">
                      <span className={`text-sm font-black ${medalColor(item.rank)}`}>
                        #{item.rank}
                      </span>
                    </div>

                    {/* Name + state */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-bold truncate ${isMe ? 'text-primary' : 'text-gray-800'}`}>
                          {item.name}
                        </p>
                        {isMe && (
                          <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      {item.state && (
                        <p className="text-[10px] text-gray-400 uppercase font-black mt-0.5">{item.state}</p>
                      )}
                    </div>

                    {/* Points */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-secondary">{item.totalPoints} pts</p>
                    </div>
                  </div>
                );
              })}

              {ranking.length === 0 && (
                <div className="py-16 text-center px-6">
                  <p className="text-gray-400 text-sm font-medium">No rankings available yet</p>
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
