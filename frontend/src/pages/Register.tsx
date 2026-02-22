import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { Community } from '../types';


const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    city: '',
    state: '',
    country: '',
    communityId1: '',
    communityId2: '',
    requestedCommunity: '',
  });

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingCommunities, setLoadingCommunities] = useState(true);

  // Fetch communities on component mount
  useEffect(() => {
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
  }, []);

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

    // Frontend validation: Check if at least one community is provided (selected or requested)
    if (!formData.communityId1 && !formData.requestedCommunity) {
      setError('Please select an existing community or request a new one.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.register(formData);

      // If they only REQUESTED a community, the backend will block login.
      // We should check if communityId1 was provided in the response (or if we sent it)
      if (!formData.communityId1) {
        setError('Your request has been submitted. An admin will review it soon. You can log in once your first community is approved.');
        setLoading(false);
        // We don't call login() here because they can't log in yet.
        return;
      }

      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full my-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-primary mb-4 sm:mb-6">
          Join Fifa26Predictor
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community 1 (Required)
              </label>
              <select
                name="communityId1"
                value={formData.communityId1}
                onChange={handleChange}
                disabled={loadingCommunities}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary disabled:bg-gray-100"
              >
                <option value="">Select a community...</option>
                {communities.map((community) => (
                  <option key={community._id} value={community.communityId}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community 2 (Optional)
              </label>
              <select
                name="communityId2"
                value={formData.communityId2}
                onChange={handleChange}
                disabled={loadingCommunities}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary disabled:bg-gray-100"
              >
                <option value="">Select a community...</option>
                {communities.map((community) => (
                  <option key={community._id} value={community.communityId}>
                    {community.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Don't see your community? Request here:
            </label>
            <input
              type="text"
              name="requestedCommunity"
              value={formData.requestedCommunity}
              onChange={handleChange}
              placeholder="Enter community name"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <p className="text-[10px] text-gray-500 mt-1 italic leading-tight">
              Note: If you request a new community as your first community, your account will be pending approval before you can log in.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white py-2 rounded font-medium hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form >

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{' '}
          <a href="/login" className="text-secondary hover:underline">
            Login
          </a>
        </p>
      </div >
    </div >
  );
};

export default Register;
