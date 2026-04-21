import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuthStore } from '../context/store';

interface Community {
  Community_ID: string;
  Name: string;
  State: string;
  City: string;
  President_Name?: string;
}

const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { googleData } = (location.state as any) || {};
  const { user, login } = useAuthStore();

  const [formData, setFormData] = useState({
    city: '',
    state: '',
    country: '',
    communityId: '',
    phoneNumber: '',
  });

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  useEffect(() => {
    // SECURITY CHECK: If no logged-in user AND no Google signup data, go back to login
    if (!user && !googleData) {
      navigate('/login');
      return;
    }

    // If user is already set up and not coming from Google register, redirect to dashboard
    if (user && user.City !== 'Not Set' && user.Country !== 'Not Set' && !googleData) {
      navigate('/dashboard');
    }

    // Pre-fill if we have existing data
    if (user) {
      setFormData(prev => ({
        ...prev,
        city: user.City === 'Not Set' ? '' : user.City || '',
        state: user.State === 'Not Set' ? '' : user.State || '',
        country: user.Country === 'Not Set' ? '' : user.Country || '',
        communityId: user.Community_ID?.toString() || '',
        phoneNumber: user.WhatsApp_Number || '',
      }));
    } else if (googleData) {
      // Potentially pre-fill some fields from googleData if available
    }

    const fetchCommunities = async () => {
      try {
        const response = await apiService.getCommunities();
        setCommunities(response.data);
      } catch (err) {
        console.error('Failed to fetch communities:', err);
      } finally {
        setLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let response;
      if (googleData) {
        // Mode: Create NEW Google User
        response = await apiService.register({
          ...formData,
          email: googleData.email,
          firstName: googleData.firstName,
          lastName: googleData.lastName,
          googleId: googleData.googleId,
          profileImage: googleData.profileImage
        });
      } else {
        // Mode: Update Existing User
        response = await apiService.updateProfile(formData);
      }

      const { token, user: newUser } = response.data;

      // Update global auth store
      // If updating existing, token might already be in localstorage
      const finalToken = token || localStorage.getItem('token') || '';
      login(finalToken, newUser || response.data);

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Profile setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 to-emerald-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full my-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-green-800 mb-4">
          Complete Your Profile
        </h2>

        <p className="text-center text-gray-600 mb-6">
          Welcome{user?.First_Name || googleData?.firstName ? `, ${user?.First_Name || googleData?.firstName}` : ''}! Please provide a few more details to complete your registration.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+91 1234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Halaqa <span className="text-red-500">*</span>
            </label>
            <select
              name="communityId"
              value={formData.communityId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-600"
              disabled={loadingCommunities}
              required
            >
              <option value="" disabled>Select your Halaqa</option>
              {communities.map(c => (
                <option key={c.Community_ID} value={c.Community_ID}>{c.Name}</option>
              ))}
            </select>
            {loadingCommunities && (
              <p className="text-sm text-gray-500 mt-1">Loading Halaqas...</p>
            )}
            {formData.communityId && (() => {
              const selected = communities.find(c => c.Community_ID === formData.communityId);
              return selected?.President_Name ? (
                <p className="text-sm text-green-700 font-medium mt-2 flex items-center gap-1">
                  <span>👤</span> President: <span className="font-bold">{selected.President_Name}</span>
                </p>
              ) : null;
            })()}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2 rounded font-medium hover:bg-green-800 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Finish Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
