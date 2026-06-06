import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { Community } from '../types';
import SearchableDropdown from '../components/SearchableDropdown';


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
    phoneNumber: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDropdownChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getCommunityFullName = (communityId: string) => {
    const community = communities.find((c) => c.communityId === communityId);
    if (!community) return '';
    return community.fullName || community.name;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.communityId1 && formData.communityId2 && formData.communityId1 === formData.communityId2) {
      setError('Community 1 and Community 2 must be different.');
      setLoading(false);
      return;
    }

    try {
      const response = await apiService.register(formData);

      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      <div className="bg-white/10 border border-white/15 backdrop-blur-sm rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full my-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-4 sm:mb-6">
          Join Velicham WORLD CUP '26 Prediction
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/80 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-white/80 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                State <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-white/80 mb-1">
              Country <span className="text-red-400">*</span>
            </label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            >
              <option value="" className="bg-gray-900 text-white">Select Country</option>
              <option value="USA" className="bg-gray-900 text-white">USA</option>
              <option value="Canada" className="bg-gray-900 text-white">Canada</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-white/80 mb-1">
              Phone Number <span className="text-[10px] text-white/40 font-normal uppercase">(Optional)</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+1234567890"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/30 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <SearchableDropdown
                label={<>Community 1 <span className="text-[10px] text-white/40 font-normal uppercase">(Optional)</span></>}
                value={formData.communityId1}
                onChange={(val) => handleDropdownChange('communityId1', val)}
                options={communities
                  .filter((c) => c.communityId !== formData.communityId2)
                  .map(c => ({ id: c.communityId, label: c.name }))}
                placeholder="Search community..."
                disabled={loadingCommunities}
              />
              <p className="mt-2 text-xs text-blue-700 font-medium min-h-[1rem]">
                {formData.communityId1 ? getCommunityFullName(formData.communityId1) : ''}
              </p>
            </div>
            <div>
              <SearchableDropdown
                label={<>Community 2 <span className="text-[10px] text-white/40 font-normal uppercase">(Optional)</span></>}
                value={formData.communityId2}
                onChange={(val) => handleDropdownChange('communityId2', val)}
                options={communities
                  .filter((c) => c.communityId !== formData.communityId1)
                  .map(c => ({ id: c.communityId, label: c.name }))}
                placeholder="Search community..."
                disabled={loadingCommunities}
              />
              <p className="mt-2 text-xs text-white/60 font-medium min-h-[1rem]">
                {formData.communityId2 ? getCommunityFullName(formData.communityId2) : ''}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <div className="rounded-xl border border-sky-300/25 bg-sky-400/10 p-4 shadow-sm">
              <div className="flex gap-3">
                <div className="bg-sky-400/20 p-1.5 rounded-full shrink-0 h-fit">
                  <svg className="w-4 h-4 text-sky-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-[11px] text-sky-100/90 leading-relaxed">
                  <span className="font-bold text-sky-200 block mb-1">Don't see your community?</span>
                  If you are not finding your community, please complete the registration without selecting a community. Once registered, please access the <strong>Profile</strong> page from your Dashboard to request to onboard your community. Once the Admin approves the community, you will be notified and can then select the community in your profile.
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-white py-2 rounded font-medium hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form >

        <p className="text-center text-white/60 mt-4">
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
