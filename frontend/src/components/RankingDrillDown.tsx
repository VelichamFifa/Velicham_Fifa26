import React, { useState, useEffect } from 'react';
import { apiService } from '../services/apiService';

interface RankingItem {
  userId: string;
  name: string;
  totalPoints: number;
  rank: number;
  state?: string;
}

interface RankingDrillDownProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  isDaily: boolean;
  title: string;
  currentUserId?: string;
}

const RankingDrillDown: React.FC<RankingDrillDownProps> = ({
  isOpen,
  onClose,
  communityId,
  isDaily,
  title,
  currentUserId,
}) => {
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadRanking();
    }
  }, [isOpen, communityId, isDaily]);

  const loadRanking = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getCommunityRanking(communityId, isDaily);
      setRanking(res.data.ranking);
    } catch (err) {
      console.error('Failed to load ranking:', err);
      setError('Failed to load ranking details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary p-4 flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
            <p className="text-blue-100 text-xs mt-0.5">
              {isDaily ? 'Today\'s Standings' : 'Overall Rankings'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-500 text-sm">Fetching ranks...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-500 text-sm px-6">
              {error}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {ranking.map((item) => {
                const isMe = item.userId === currentUserId;
                return (
                  <div 
                    key={item.userId} 
                    className={`flex items-center gap-4 p-4 transition ${isMe ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="w-8 flex-shrink-0 text-center">
                      <span className={`text-sm font-black ${
                        item.rank === 1 ? 'text-yellow-500' : 
                        item.rank === 2 ? 'text-gray-400' : 
                        item.rank === 3 ? 'text-amber-600' : 
                        'text-gray-400'
                      }`}>
                        #{item.rank}
                      </span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold truncate ${isMe ? 'text-primary' : 'text-gray-800'}`}>
                          {item.name} {isMe && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded ml-1">YOU</span>}
                        </p>
                      </div>
                      {item.state && <p className="text-[10px] text-gray-400 uppercase font-black">{item.state}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-secondary">{item.totalPoints} pts</p>
                    </div>
                  </div>
                );
              })}
              {ranking.length === 0 && (
                <div className="py-12 text-center px-6">
                  <p className="text-gray-400 text-sm font-medium">
                    {isDaily
                      ? 'No matches finalized today yet'
                      : 'No rankings available yet'}
                  </p>
                  {isDaily && (
                    <p className="text-gray-300 text-xs mt-1">Check back after today's matches are completed</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-center">
          <button 
            onClick={onClose}
            className="text-sm font-bold text-gray-500 hover:text-gray-700 px-6 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RankingDrillDown;
