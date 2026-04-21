import { apiService } from '../services/api';
import { useAuthStore } from '../context/store';
import { useState, useEffect } from 'react';

interface Community {
  Community_ID: string;
  Name: string;
  State: string;
  City: string;
}

const Profile: React.FC = () => {
  const { setUser } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, communitiesRes] = await Promise.all([
        apiService.getProfile(),
        apiService.getCommunities()
      ]);
      const p = profileRes.data;
      setProfile(p);
      setUser(p); // Update Global State
      setCommunities(communitiesRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kerala-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-kerala-blue-600 px-4 py-3 rounded relative">
          {error}
          <button onClick={() => setError('')} className="absolute right-2 top-2">×</button>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-kerala-blue-700 to-kerala-blue-900 px-8 py-10 text-white">
          <h1 className="text-3xl font-bold">
            {profile?.First_Name} {profile?.Last_Name}
          </h1>
          <p className="text-kerala-blue-100 mt-1 uppercase tracking-widest text-xs font-bold">
            {profile?.role || 'USER'}
          </p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Details */}
            <div>
              <h2 className="text-lg font-bold text-kerala-blue-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Personal Details
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">Email</label>
                  <p className="text-gray-800 font-medium bg-gray-50 px-3 py-2 rounded">{profile?.Email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">First Name</label>
                    <p className="text-gray-800 font-medium px-1">{profile?.First_Name}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">Last Name</label>
                    <p className="text-gray-800 font-medium px-1">{profile?.Last_Name}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">Phone Number</label>
                  <p className="text-gray-800 font-medium px-1">{profile?.WhatsApp_Number || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-lg font-bold text-kerala-blue-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">City</label>
                    <p className="text-gray-800 font-medium px-1">{profile?.City || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">State</label>
                    <p className="text-gray-800 font-medium px-1">{profile?.State || '-'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-black mb-0.5">Country</label>
                  <p className="text-gray-800 font-medium px-1">{profile?.Country || '-'}</p>
                </div>
              </div>
            </div>

            {/* Halaqa */}
            <div className="md:col-span-2 pt-6 border-t border-gray-100">
              <div className="mb-4">
                <h2 className="text-lg font-bold text-kerala-blue-700 flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Halaqa
                </h2>
                <label className="block text-[9px] text-gray-400 uppercase font-black mb-1">My Halaqa</label>
                <p className="text-kerala-blue-700 font-bold">
                  {profile?.Community_ID
                    ? communities.find(c => String(c.Community_ID) === String(profile.Community_ID))?.Name || 'Unknown'
                    : 'None assigned'}
                </p>
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Profile;
