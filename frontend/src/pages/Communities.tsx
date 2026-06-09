import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

interface Community {
  communityId: string;
  name: string;
  fullName?: string;
  shortName?: string;
  city?: string;
  state?: string;
  isOnline?: boolean;
  description?: string;
}

const Communities: React.FC = () => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setLoading(true);
        const res = await apiService.getCommunities();
        setCommunities(res.data);
      } catch (err) {
        console.error('Failed to fetch communities', err);
        setError('Failed to load communities. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCommunities();
  }, []);

  const filteredCommunities = communities.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.fullName?.toLowerCase().includes(term) ||
      c.name?.toLowerCase().includes(term) ||
      c.shortName?.toLowerCase().includes(term) ||
      c.city?.toLowerCase().includes(term) ||
      c.state?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white min-h-[calc(100vh-4rem)]">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Community Directory</h1>
          <p className="text-white/60">Browse all active communities in the Velicham WORLD CUP '26 Prediction platform.</p>
        </div>
      </div>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search by name, city, or state..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60 shadow-lg"
        />
        <svg className="absolute left-4 top-3.5 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400 mx-auto"></div>
          <p className="mt-4 text-white/50">Loading communities...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-500/20 border border-rose-500/50 text-rose-200 p-4 rounded-xl text-center">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.length > 0 ? (
            filteredCommunities.map((community) => (
              <div 
                key={community.communityId} 
                className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl hover:border-white/20 hover:bg-white/10 transition-all flex flex-col"
                style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1a2744 50%, #0c1a1a 100%)' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-white line-clamp-1" title={community.fullName || community.name}>
                      {community.fullName || community.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                        {community.name}
                      </span>
                      {community.isOnline ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Online
                        </span>
                      ) : (
                        <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                          Local
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {!community.isOnline && (community.city || community.state) && (
                  <div className="flex items-center gap-1.5 text-xs text-white/60 mb-3 font-medium uppercase tracking-wider">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {community.city}{community.city && community.state ? ', ' : ''}{community.state}
                  </div>
                )}

                <div className="text-sm text-white/50 flex-grow mb-6 line-clamp-3">
                  {community.description || 'No description available for this community.'}
                </div>

                <div className="mt-auto pt-4 border-t border-white/10">
                  <button
                    onClick={() => navigate(`/community/${community.communityId}/members`)}
                    className="w-full text-center text-sm font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center justify-center gap-2"
                  >
                    View Members
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-white/50">No communities found matching your search.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Communities;