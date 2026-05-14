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
  const [requestedCommunity, setRequestedCommunity] = useState({
    name: '',
    shortName: '',
    description: '',
    isOnline: false,
    city: '',
    state: '',
  });

  const [communities, setCommunities] = useState<Community[]>([]);
  const [showCommunityRequest, setShowCommunityRequest] = useState(false);
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
    const isCheckbox = e.target instanceof HTMLInputElement && e.target.type === 'checkbox';
    const val = isCheckbox ? (e.target as HTMLInputElement).checked : value;

    if (name.startsWith('req_')) {
      const field = name.replace('req_', '');
      setRequestedCommunity(prev => ({ ...prev, [field]: val }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: val,
      }));
    }
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

    if (!formData.communityId1) {
      setError('Community 1 is required.');
      setLoading(false);
      return;
    }

    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required.');
      setLoading(false);
      return;
    }

    if (formData.communityId1 && formData.communityId2 && formData.communityId1 === formData.communityId2) {
      setError('Community 1 and Community 2 must be different.');
      setLoading(false);
      return;
    }

    // Validation: Name and Short Name are always required. Description is optional. 
    // City and State are required only if NOT an online community.
    if (showCommunityRequest) {
      const isMissingRequired = !requestedCommunity.name || !requestedCommunity.shortName;
      const isMissingLocation = !requestedCommunity.isOnline && (!requestedCommunity.city || !requestedCommunity.state);

      if (isMissingRequired || isMissingLocation) {
        setError('Please fill in all required details for the new community request.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        requestedCommunity: showCommunityRequest ? requestedCommunity : null
      };
      const response = await apiService.register(payload);

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
          Join Velicham Fifa'26 Prediction
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
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="">Select Country</option>
              <option value="USA">USA</option>
              <option value="Canada">Canada</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (Required)
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="+1234567890"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <SearchableDropdown
                label="Community 1"
                value={formData.communityId1}
                onChange={(val) => handleDropdownChange('communityId1', val)}
                options={communities
                  .filter((c) => c.communityId !== formData.communityId2)
                  .map(c => ({ id: c.communityId, label: c.name }))}
                placeholder="Search community..."
                disabled={loadingCommunities}
                required
              />
              <p className="mt-2 text-xs text-blue-700 font-medium min-h-[1rem]">
                {formData.communityId1 ? getCommunityFullName(formData.communityId1) : ''}
              </p>
            </div>
            <div>
              <SearchableDropdown
                label="Community 2 (Optional)"
                value={formData.communityId2}
                onChange={(val) => handleDropdownChange('communityId2', val)}
                options={communities
                  .filter((c) => c.communityId !== formData.communityId1)
                  .map(c => ({ id: c.communityId, label: c.name }))}
                placeholder="Search community..."
                disabled={loadingCommunities}
              />
              <p className="mt-2 text-xs text-gray-700 font-medium min-h-[1rem]">
                {formData.communityId2 ? getCommunityFullName(formData.communityId2) : ''}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowCommunityRequest(!showCommunityRequest)}
              className="text-sm text-secondary font-bold hover:underline flex items-center transition-all duration-300"
            >
              <span className={`mr-2 transform transition-transform ${showCommunityRequest ? 'rotate-90' : ''}`}>▶</span>
              {showCommunityRequest ? "I'll join an existing community instead" : "Don't see your community? Request a new one"}
            </button>

            {showCommunityRequest && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                <h4 className="text-secondary font-bold text-sm mb-3">Community Request Details</h4>

                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    id="isOnline"
                    name="req_isOnline"
                    checked={requestedCommunity.isOnline}
                    onChange={handleChange}
                    className="w-4 h-4 text-secondary focus:ring-secondary border-gray-300 rounded"
                  />
                  <label htmlFor="isOnline" className="text-xs font-bold text-gray-700 uppercase cursor-pointer">
                    This is an Online Community
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="req_name"
                      value={requestedCommunity.name}
                      onChange={handleChange}
                      placeholder="e.g. Mountain House Sports"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                      Short Name / Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="req_shortName"
                      value={requestedCommunity.shortName}
                      onChange={handleChange}
                      placeholder="e.g. MHS"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-secondary"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                    Description <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                  </label>
                  <textarea
                    name="req_description"
                    value={requestedCommunity.description}
                    onChange={handleChange}
                    placeholder="Tell us about this community..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-secondary"
                  />
                </div>

                {!requestedCommunity.isOnline && (
                  <div className="grid grid-cols-2 gap-3 pb-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="req_city"
                        value={requestedCommunity.city}
                        onChange={handleChange}
                        placeholder="e.g. Mountain House"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="req_state"
                        value={requestedCommunity.state}
                        onChange={handleChange}
                        placeholder="e.g. California"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-secondary"
                      />
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-blue-600 mt-3 italic leading-tight">
                  Note: If you request a new community as your first community, your account will be pending approval before you can log in.
                </p>
              </div>
            )}
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
