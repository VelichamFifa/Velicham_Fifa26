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
  const [editLoading, setEditLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    city: '',
    state: '',
    country: '',
    communityId: '',
    phoneNumber: '',
  });

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
      setFormData({
        city: p.City || '',
        state: p.State || '',
        country: p.Country || '',
        communityId: p.Community_ID?.toString() || '',
        phoneNumber: p.WhatsApp_Number || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setEditLoading(true);
      setError('');
      setSuccess('');
      await apiService.updateProfile(formData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          {success}
          <button onClick={() => setSuccess('')} className="absolute right-2 top-2">×</button>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
          <button onClick={() => setError('')} className="absolute right-2 top-2">×</button>
        </div>
      )}

      <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-green-700 to-emerald-900 px-8 py-10 text-white">
          <h1 className="text-3xl font-bold">
            {profile?.First_Name} {profile?.Last_Name}
          </h1>
          <p className="text-green-200 mt-1 uppercase tracking-widest text-xs font-bold">
            {profile?.role || 'USER'}
          </p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Details */}
            <div>
              <h2 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
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
              <h2 className="text-lg font-bold text-green-800 mb-4 flex items-center gap-2">
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

            {/* Community */}
            <div className="md:col-span-2 pt-6 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                <h2 className="text-lg font-bold text-green-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Community
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-green-50 text-green-700 hover:bg-green-100 text-[11px] px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 border border-green-200"
                  >
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[9px] text-green-600 uppercase font-black mb-1">Community</label>
                    <select
                      name="communityId"
                      value={formData.communityId}
                      onChange={handleChange}
                      className="w-full px-2 py-1 text-sm border rounded bg-white font-bold text-green-800"
                    >
                      <option value="">None</option>
                      {communities.map(c => (
                        <option key={c.Community_ID} value={c.Community_ID}>{c.Name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-[9px] text-gray-400 uppercase font-black mb-1">My Community</label>
                  <p className="text-green-800 font-bold">
                    {profile?.Community_ID
                      ? communities.find(c => c.Community_ID === profile.Community_ID)?.Name || 'Unknown'
                      : 'None assigned'}
                  </p>
                </div>
              )}

              {isEditing && (
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={editLoading}
                    className="px-6 py-2 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={editLoading}
                    className="bg-green-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-800 transition shadow disabled:opacity-50"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 text-xs text-gray-500 italic">
          Account status: <span className="text-green-600 font-bold uppercase">{profile?.Status || 'Active'}</span>
        </div>
      </div>
    </div>
  );
};

export default Profile;
