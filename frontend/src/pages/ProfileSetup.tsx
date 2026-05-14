import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import SearchableDropdown from '../components/SearchableDropdown';

interface Community {
    _id: string;
    communityId: string;
    name: string;
    fullName?: string;
    state: string;
    city: string;
}

const ProfileSetup: React.FC = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth(); // Need login to update the stored user context

    const [formData, setFormData] = useState({
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

    useEffect(() => {
        // If user is already set up perfectly, redirect to dashboard
        if (user && user.city !== 'Not Set' && user.country !== 'Not Set') {
            navigate('/dashboard');
        }

        // Pre-fill if we have existing data (even if it's 'Not Set' we should clear it for the form)
        if (user) {
            setFormData(prev => ({
                ...prev,
                city: user.city === 'Not Set' ? '' : user.city || '',
                state: user.state === 'Not Set' ? '' : user.state || '',
                country: user.country === 'Not Set' ? '' : user.country || '',
            }));
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

        try {
            // Need an update profile endpoint if one exists
            const response = await apiService.updateProfile(formData);

            // Update global user context with new details
            const token = localStorage.getItem('token') || '';
            login(token, response.data.user);

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Profile setup failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-md w-full my-4">
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-primary mb-4 sm:mb-6">
                    Complete Your Profile
                </h2>

                <p className="text-center text-gray-600 mb-6">
                    Welcome{user?.firstName ? `, ${user.firstName}` : ''}! Please provide a few more details to complete your registration.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="+1234567890"
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                            required
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
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Country <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-secondary"
                            required
                        >
                            <option value="">Select Country</option>
                            <option value="USA">USA</option>
                            <option value="Canada">Canada</option>
                        </select>
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-secondary text-white py-2 rounded font-medium hover:bg-blue-600 transition disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Finish Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSetup;
